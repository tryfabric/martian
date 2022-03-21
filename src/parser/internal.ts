import * as md from '../markdown';
import * as notion from '../notion';
import {URL} from 'url';
import {LIMITS} from '../notion';

function ensureLength(text: string, copy?: object) {
  const chunks = text.match(/[^]{1,2000}/g) || [];
  return chunks.flatMap((item: string) => notion.richText(item, copy));
}

function parseInline(
  element: md.PhrasingContent,
  options?: notion.RichTextOptions
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

    default:
      return [];
  }
}

function parseParagraph(element: md.Paragraph): notion.Block {
  // If a paragraph containts an image element as its first element
  // Lets assume it is an image, and parse it as only that (discard remaining content)
  const isImage = element.children[0].type === 'image';
  if (isImage) {
    const image = element.children[0] as md.Image;
    try {
      new URL(image.url);
      return notion.image(image.url);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.log(
        `${error.input} is not a valid url, I will process this as text for you to fix later`
      );
    }
  }

  // Paragraphs can also be legacy 'TOC' from some markdown
  const mightBeToc =
    element.children.length > 2 &&
    element.children[0].type === 'text' &&
    element.children[0].value === '[[' &&
    element.children[1].type === 'emphasis';
  if (mightBeToc) {
    const emphasisItem = element.children[1] as md.Emphasis;
    const emphasisTextItem = emphasisItem.children[0] as md.Text;
    if (emphasisTextItem.value === 'TOC') {
      return notion.table_of_contents();
    }
  }

  const text = element.children.flatMap(child => parseInline(child));
  return notion.paragraph(text);
}

function parseBlockquote(element: md.Blockquote): notion.Block {
  // Quotes can only contain RichText[], but come through as Block[]
  // This code collects and flattens the common ones
  const blocks = element.children.flatMap(child => parseNode(child));
  const paragraphs = blocks.flatMap(child => child as notion.Block);
  const richtext = paragraphs.flatMap(child => {
    if (child.paragraph) {
      return child.paragraph.text as notion.RichText[];
    }
    if (child.heading_1) {
      return child.heading_1.text as notion.RichText[];
    }
    if (child.heading_2) {
      return child.heading_2.text as notion.RichText[];
    }
    if (child.heading_3) {
      return child.heading_3.text as notion.RichText[];
    }
    return [];
  });
  return notion.blockquote(richtext as notion.RichText[]);
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
  return notion.code(text);
}

function parseList(element: md.List): notion.Block[] {
  return element.children.flatMap(item => {
    const paragraph = item.children.shift();
    if (paragraph === undefined || paragraph.type !== 'paragraph') {
      return [] as notion.Block[];
    }

    const text = paragraph.children.flatMap(child => parseInline(child));

    // Now process any of the children
    const parsedChildren: notion.Block[] = item.children.flatMap(child =>
      parseNode(child)
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

function parseTableCell(node: md.TableCell): notion.RichText[][] {
  return [node.children.flatMap(child => parseInline(child))];
}

function parseTableRow(node: md.TableRow): notion.Block[] {
  const tableCells = node.children.flatMap(child => parseTableCell(child));
  return [notion.tableRow(tableCells)];
}

function parseTable(node: md.Table): notion.Block[] {
  // The width of the table is the amount of cells in the first row, as all rows must have the same number of cells
  const tableWidth = node.children?.length
    ? node.children[0].children.length
    : 0;

  const tableRows = node.children.flatMap(child => parseTableRow(child));
  return [notion.table(tableRows, tableWidth)];
}

function parseNode(node: md.FlowContent, unsupported = false): notion.Block[] {
  switch (node.type) {
    case 'heading':
      return [parseHeading(node)];

    case 'paragraph':
      return [parseParagraph(node)];

    case 'code':
      return [parseCode(node)];

    case 'blockquote':
      return [parseBlockquote(node)];

    case 'list':
      return parseList(node);

    case 'table':
      if (unsupported) {
        return parseTable(node);
      } else {
        return [];
      }

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
  /** Whether to allow unsupported object types. */
  allowUnsupported?: boolean;
}

export function parseBlocks(
  root: md.Root,
  options?: BlocksOptions
): notion.Block[] {
  const parsed = root.children.flatMap(item =>
    parseNode(item, options?.allowUnsupported === true)
  );

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

export function parseRichText(
  root: md.Root,
  options?: CommonOptions
): notion.RichText[] {
  if (root.children[0].type !== 'paragraph') {
    throw new Error(`Unsupported markdown element: ${JSON.stringify(root)}`);
  }

  const richTexts: notion.RichText[] = [];
  root.children.forEach(paragraph => {
    if (paragraph.type === 'paragraph') {
      paragraph.children.forEach(child =>
        richTexts.push(...parseInline(child))
      );
    }
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
