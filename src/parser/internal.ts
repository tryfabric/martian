import * as md from '../markdown';
import * as notion from '../notion';
import path from 'path';
import {URL} from 'url';

const nbuild = notion.Builders,
  {LIMITS} = notion;

function ensureLength(text: string, copy?: object) {
  const chunks = text.match(/[^]{1,2000}/g) || [];
  return chunks.flatMap((item: string) => notion.Builders.richText(item, copy));
}

function ensureCodeBlockLanguage(lang?: string) {
  if (lang) {
    lang = lang.toLowerCase();
    return notion.isCodeLang(lang) ? lang : notion.parseCodeLanguage(lang);
  }

  return undefined;
}

function parseInline(
  element: md.PhrasingContent,
  options?: notion.Builders.RichTextOptions
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
      return nbuild.richText(element.value, copy);

    case 'inlineMath':
      return nbuild.richText(element.value, {...copy, type: 'equation'});

    default:
      return [];
  }
}

function parseImage(image: md.Image, options: BlocksOptions) {
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
  ];

  function dealWithError() {
    return nbuild.paragraph(nbuild.richText(image.url));
  }

  try {
    if (options.strictImageUrls ?? true) {
      const parsedUrl = new URL(image.url);
      const fileType = path.extname(parsedUrl.pathname);
      if (allowedTypes.includes(fileType)) {
        return nbuild.image(image.url);
      } else {
        return dealWithError();
      }
    } else {
      return nbuild.image(image.url);
    }
  } catch (error: unknown) {
    return dealWithError();
  }
}

function parseParagraph(
  element: md.Paragraph,
  options: BlocksOptions
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
      return [nbuild.tableOfContents()];
    }
  }

  // Notion doesn't deal with inline images, so we need to parse them all out
  // of the paragraph into individual blocks
  const images: notion.Block[] = [];
  const paragraphs: Array<notion.RichText[]> = [];
  element.children.forEach(item => {
    if (item.type === 'image') {
      images.push(parseImage(item, options));
    } else {
      const richText = parseInline(item) as notion.RichText[];
      if (richText.length) {
        paragraphs.push(richText);
      }
    }
  });

  if (paragraphs.length) {
    return [nbuild.paragraph(paragraphs.flat()), ...images];
  } else {
    return images;
  }
}

function parseBlockquote(
  element: md.Blockquote,
  options: BlocksOptions
): notion.Block {
  const children = element.children.flatMap(child => parseNode(child, options));
  return nbuild.quote([], children);
}

function parseHeading(element: md.Heading): notion.Block {
  const text = element.children.flatMap(child => parseInline(child));

  switch (element.depth) {
    case 1:
      return nbuild.headingOne(text);

    case 2:
      return nbuild.headingTwo(text);

    default:
      return nbuild.headingThree(text);
  }
}

function parseCode(element: md.Code): notion.Block {
  const text = ensureLength(element.value);
  const lang = ensureCodeBlockLanguage(element.lang);
  return nbuild.code(text, lang);
}

function parseList(element: md.List, options: BlocksOptions): notion.Block[] {
  return element.children.flatMap(item => {
    const paragraph = item.children.shift();
    if (paragraph === undefined || paragraph.type !== 'paragraph') {
      return [] as notion.Block[];
    }

    const text = paragraph.children.flatMap(child => parseInline(child));

    // Now process any of the children
    const parsedChildren = item.children.flatMap(child =>
      parseNode(child, options)
    );

    if (element.start !== null && element.start !== undefined) {
      return [nbuild.numberedListItem(text, parsedChildren)];
    } else if (item.checked !== null && item.checked !== undefined) {
      return [nbuild.toDo(item.checked, text, parsedChildren)];
    } else {
      return [nbuild.bulletedListItem(text, parsedChildren)];
    }
  });
}

function parseTableCell(node: md.TableCell): notion.RichText[][] {
  return [node.children.flatMap(child => parseInline(child))];
}

function parseTableRow(
  node: md.TableRow
): notion.NotionRequest.Blocks.TableRow[] {
  const tableCells = node.children.flatMap(child => parseTableCell(child));
  return [nbuild.tableRow(tableCells)];
}

function parseTable(node: md.Table): notion.Block[] {
  // The width of the table is the amount of cells in the first row, as all rows must have the same number of cells
  const tableWidth = node.children?.length
    ? node.children[0].children.length
    : 0;

  const tableRows = node.children.flatMap(child => parseTableRow(child));
  return [nbuild.table(tableRows, tableWidth)];
}

function parseMath(node: md.Math): notion.Block {
  const textWithKatexNewlines = node.value.split('\n').join('\\\\\n');
  return nbuild.equation(textWithKatexNewlines);
}

function parseNode(
  node: md.FlowContent,
  options: BlocksOptions
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
}

export function parseBlocks(
  root: md.Root,
  options?: BlocksOptions
): notion.Block[] {
  const parsed = root.children.flatMap(item => parseNode(item, options || {}));

  const truncate = !!(options?.notionLimits?.truncate ?? true),
    limitCallback = options?.notionLimits?.onError ?? (() => {});

  if (parsed.length > LIMITS.PAYLOAD_BLOCKS)
    limitCallback(
      new Error(
        `Resulting blocks array exceeds Notion limit (${LIMITS.PAYLOAD_BLOCKS})`
      )
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
  options?: RichTextOptions
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
        `Resulting richTexts array exceeds Notion limit (${LIMITS.RICH_TEXT_ARRAYS})`
      )
    );

  return (
    truncate ? richTexts.slice(0, LIMITS.RICH_TEXT_ARRAYS) : richTexts
  ).map(rt => {
    if (rt.type !== 'text') return rt;

    if (rt.text.content.length > LIMITS.RICH_TEXT.TEXT_CONTENT) {
      limitCallback(
        new Error(
          `Resulting text content exceeds Notion limit (${LIMITS.RICH_TEXT.TEXT_CONTENT})`
        )
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
          `Resulting text URL exceeds Notion limit (${LIMITS.RICH_TEXT.LINK_URL})`
        )
      );

    // Notion equations are not supported by this library, since they don't exist in Markdown

    return rt;
  });
}
