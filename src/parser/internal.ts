import * as md from '../markdown';
import * as notion from '../notion';
import path from 'path';
import {URL} from 'url';
import {isSupportedCodeLang, LIMITS} from '../notion';

function ensureLength(text: string, copy?: object) {
  const chunks = text.match(/[^]{1,2000}/g) || [];
  return chunks.flatMap((item: string) => notion.richText(item, copy));
}

function ensureCodeBlockLanguage(lang?: string) {
  if (lang) {
    lang = lang.toLowerCase();
    return isSupportedCodeLang(lang) ? lang : notion.parseCodeLanguage(lang);
  }

  return undefined;
}

function parseInline(
  element: md.PhrasingContent,
  options?: notion.RichTextOptions,
): notion.RichText[] {
  const copy = {
    annotations: {
      ...(options?.annotations ?? {}),
    },
    url: options?.url,
  };

  switch (element.type) {
    case 'text':
      return ensureLength(element.value, copy);

    case 'delete':
      copy.annotations.strikethrough = true;
      return element.children.flatMap(child => parseInline(child, copy));

    case 'emphasis':
      copy.annotations.italic = true;
      return element.children.flatMap(child => parseInline(child, copy));

    case 'strong':
      copy.annotations.bold = true;
      return element.children.flatMap(child => parseInline(child, copy));

    case 'link':
      copy.url = element.url;
      return element.children.flatMap(child => parseInline(child, copy));

    case 'inlineCode':
      copy.annotations.code = true;
      return [notion.richText(element.value, copy)];

    case 'inlineMath':
      return [notion.richText(element.value, {...copy, type: 'equation'})];

    default:
      return [];
  }
}

function parseImage(image: md.Image, options: BlocksOptions): notion.Block {
  // https://developers.notion.com/reference/block#image-blocks
  const allowedTypes = [
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.tif',
    '.tiff',
    '.bmp',
    '.svg',
    '.heic',
    '.webp',
  ];

  function dealWithError() {
    return notion.paragraph([notion.richText(image.url)]);
  }

  try {
    if (options.strictImageUrls ?? true) {
      const parsedUrl = new URL(image.url);
      const fileType = path.extname(parsedUrl.pathname);
      if (allowedTypes.includes(fileType)) {
        return notion.image(image.url);
      } else {
        return dealWithError();
      }
    } else {
      return notion.image(image.url);
    }
  } catch (error: unknown) {
    return dealWithError();
  }
}

function parseParagraph(
  element: md.Paragraph,
  options: BlocksOptions,
): notion.Block[] {
  // Paragraphs can also be legacy 'TOC' from some markdown, so we check first
  const mightBeToc =
    element.children.length > 2 &&
    element.children[0].type === 'text' &&
    element.children[0].value === '[[' &&
    element.children[1].type === 'emphasis';
  if (mightBeToc) {
    const emphasisItem = element.children[1] as md.Emphasis;
    const emphasisTextItem = emphasisItem.children[0] as md.Text;
    if (emphasisTextItem.value === 'TOC') {
      return [notion.table_of_contents()];
    }
  }

  // Notion doesn't deal with inline images, so we need to parse them all out
  // of the paragraph into individual blocks
  const images: notion.Block[] = [];
  const paragraphs: notion.RichText[][] = [];
  let currentParagraph: notion.RichText[] = [];

  const pushParagraph = () => {
    if (currentParagraph.length > 0) {
      paragraphs.push(currentParagraph);
      currentParagraph = [];
    }
  };

  element.children.forEach(item => {
    if (item.type === 'image') {
      images.push(parseImage(item, options));
      return;
    }

    if (item.type === 'break') {
      pushParagraph();
      return;
    }

    const richText = parseInline(item) as notion.RichText[];
    currentParagraph.push(...richText);
  });

  pushParagraph();

  return [...paragraphs.map(notion.paragraph), ...images];
}

function parseBlockquote(
  element: md.Blockquote,
  options: BlocksOptions,
): notion.Block {
  const firstChild = element.children[0];
  const firstTextNode =
    firstChild?.type === 'paragraph'
      ? (firstChild as md.Paragraph).children[0]
      : null;

  if (firstTextNode?.type === 'text') {
    // Helper to parse subsequent blocks
    const parseSubsequentBlocks = () =>
      element.children.length > 1
        ? element.children.slice(1).flatMap(child => parseNode(child, options))
        : [];

    // Check for GFM alert syntax first (both escaped and unescaped)
    const firstLine = firstTextNode.value.split('\n')[0];
    const gfmMatch = firstLine.match(
      /^(?:\\\[|\[)!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]$/,
    );

    if (gfmMatch && notion.isGfmAlertType(gfmMatch[1])) {
      const alertType = gfmMatch[1];
      const alertConfig = notion.GFM_ALERT_MAP[alertType];
      const displayType =
        alertType.charAt(0).toUpperCase() + alertType.slice(1).toLowerCase();

      const children = [];
      const contentLines = firstTextNode.value.split('\n').slice(1);

      if (contentLines.length > 0) {
        children.push(
          notion.paragraph(
            parseInline({
              type: 'text',
              value: contentLines.join('\n'),
            }),
          ),
        );
      }

      children.push(...parseSubsequentBlocks());

      return notion.callout(
        [notion.richText(displayType)],
        alertConfig.emoji,
        alertConfig.color,
        children,
      );
    }

    // Check for emoji syntax if enabled
    if (options.enableEmojiCallouts) {
      const emojiData = notion.parseCalloutEmoji(firstTextNode.value);
      if (emojiData) {
        const paragraph = firstChild as md.Paragraph;
        const textWithoutEmoji = firstTextNode.value
          .slice(emojiData.emoji.length)
          .trimStart();

        // Process inline content from first paragraph
        const richText = paragraph.children.flatMap(child =>
          child === firstTextNode
            ? textWithoutEmoji
              ? parseInline({type: 'text', value: textWithoutEmoji})
              : []
            : parseInline(child),
        );

        return notion.callout(
          richText,
          emojiData.emoji,
          emojiData.color,
          parseSubsequentBlocks(),
        );
      }
    }
  }

  const children = element.children.flatMap(child => parseNode(child, options));
  return notion.blockquote([], children);
}

function parseHeading(element: md.Heading): notion.Block {
  const text = element.children.flatMap(child => parseInline(child));

  switch (element.depth) {
    case 1:
      return notion.headingOne(text);

    case 2:
      return notion.headingTwo(text);

    default:
      return notion.headingThree(text);
  }
}

function parseCode(element: md.Code): notion.Block {
  const text = ensureLength(element.value);
  const lang = ensureCodeBlockLanguage(element.lang);
  return notion.code(text, lang);
}

function parseList(element: md.List, options: BlocksOptions): notion.Block[] {
  return element.children.flatMap(item => {
    const paragraph = item.children.shift();
    if (paragraph === undefined || paragraph.type !== 'paragraph') {
      return [] as notion.Block[];
    }

    const text = paragraph.children.flatMap(child => parseInline(child));

    // Now process any of the children
    const parsedChildren: notion.BlockWithoutChildren[] = item.children.flatMap(
      child =>
        parseNode(child, options) as unknown as notion.BlockWithoutChildren,
    );

    if (element.start !== null && element.start !== undefined) {
      return [notion.numberedListItem(text, parsedChildren)];
    } else if (item.checked !== null && item.checked !== undefined) {
      return [notion.toDo(item.checked, text, parsedChildren)];
    } else {
      return [notion.bulletedListItem(text, parsedChildren)];
    }
  });
}

function parseTableCell(node: md.TableCell): notion.RichText[] {
  return node.children.flatMap(child => parseInline(child));
}

function parseTableRow(node: md.TableRow): notion.TableRowBlock {
  const cells = node.children.map(child => parseTableCell(child));
  return notion.tableRow(cells);
}

function parseTable(node: md.Table): notion.Block[] {
  // The width of the table is the amount of cells in the first row, as all rows must have the same number of cells
  const tableWidth = node.children?.length
    ? node.children[0].children.length
    : 0;

  const tableRows = node.children.map(child => parseTableRow(child));
  return [notion.table(tableRows, tableWidth)];
}

function parseMath(node: md.Math): notion.Block {
  const textWithKatexNewlines = node.value.split('\n').join('\\\\\n');
  return notion.equation(textWithKatexNewlines);
}

function parseNode(
  node: md.FlowContent,
  options: BlocksOptions,
): notion.Block[] {
  switch (node.type) {
    case 'heading':
      return [parseHeading(node)];

    case 'paragraph':
      return parseParagraph(node, options);

    case 'code':
      return [parseCode(node)];

    case 'blockquote':
      return [parseBlockquote(node, options)];

    case 'list':
      return parseList(node, options);

    case 'table':
      return parseTable(node);

    case 'math':
      return [parseMath(node)];

    case 'thematicBreak':
      return [notion.divider()];

    default:
      return [];
  }
}

/** Options common to all methods. */
export interface CommonOptions {
  /**
   * Define how to behave when an item exceeds the Notion's request limits.
   * @see https://developers.notion.com/reference/request-limits#limits-for-property-values
   */
  notionLimits?: {
    /**
     * Whether the excess items or characters should be automatically truncated where possible.
     * If set to `false`, the resulting item will not be compliant with Notion's limits.
     * Please note that text will be truncated only if the parser is not able to resolve
     * the issue in any other way.
     */
    truncate?: boolean;
    /** The callback for when an item exceeds Notion's limits. */
    onError?: (err: Error) => void;
  };
}

export interface BlocksOptions extends CommonOptions {
  /** Whether to render invalid images as text */
  strictImageUrls?: boolean;
  enableEmojiCallouts?: boolean;
}

export function parseBlocks(
  root: md.Root,
  options?: BlocksOptions,
): notion.Block[] {
  const parsed = root.children.flatMap(item => parseNode(item, options || {}));

  const truncate = !!(options?.notionLimits?.truncate ?? true),
    limitCallback = options?.notionLimits?.onError ?? (() => {});

  if (parsed.length > LIMITS.PAYLOAD_BLOCKS)
    limitCallback(
      new Error(
        `Resulting blocks array exceeds Notion limit (${LIMITS.PAYLOAD_BLOCKS})`,
      ),
    );

  return truncate ? parsed.slice(0, LIMITS.PAYLOAD_BLOCKS) : parsed;
}

export interface RichTextOptions extends CommonOptions {
  /**
   * How to behave when a non-inline element is detected:
   * - `ignore` (default): skip to the next element
   * - `throw`: throw an error
   */
  nonInline?: 'ignore' | 'throw';
}

export function parseRichText(
  root: md.Root,
  options?: RichTextOptions,
): notion.RichText[] {
  const richTexts: notion.RichText[] = [];

  root.children.forEach(child => {
    if (child.type === 'paragraph')
      child.children.forEach(child => richTexts.push(...parseInline(child)));
    else if (options?.nonInline === 'throw')
      throw new Error(`Unsupported markdown element: ${JSON.stringify(child)}`);
  });

  const truncate = !!(options?.notionLimits?.truncate ?? true),
    limitCallback = options?.notionLimits?.onError ?? (() => {});

  if (richTexts.length > LIMITS.RICH_TEXT_ARRAYS)
    limitCallback(
      new Error(
        `Resulting richTexts array exceeds Notion limit (${LIMITS.RICH_TEXT_ARRAYS})`,
      ),
    );

  return (
    truncate ? richTexts.slice(0, LIMITS.RICH_TEXT_ARRAYS) : richTexts
  ).map(rt => {
    if (rt.type !== 'text') return rt;

    if (rt.text.content.length > LIMITS.RICH_TEXT.TEXT_CONTENT) {
      limitCallback(
        new Error(
          `Resulting text content exceeds Notion limit (${LIMITS.RICH_TEXT.TEXT_CONTENT})`,
        ),
      );
      if (truncate)
        rt.text.content =
          rt.text.content.slice(0, LIMITS.RICH_TEXT.TEXT_CONTENT - 3) + '...';
    }

    if (
      rt.text.link?.url &&
      rt.text.link.url.length > LIMITS.RICH_TEXT.LINK_URL
    )
      // There's no point in truncating URLs
      limitCallback(
        new Error(
          `Resulting text URL exceeds Notion limit (${LIMITS.RICH_TEXT.LINK_URL})`,
        ),
      );

    // Notion equations are not supported by this library, since they don't exist in Markdown

    return rt;
  });
}
