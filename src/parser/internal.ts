import * as md from '../markdown';
import * as notion from '../notion';
import {URL} from 'url';

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
  // Paragraphs can contain inline elements that
  // If a paragraph only contains one image child
  const isImage = element.children[0].type === 'image';
  if (isImage) {
    const image = element.children[0] as md.Image;
    try {
      new URL(image.url);
      return notion.image(image.url);
    } catch (error) {
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
  const blocks = element.children.flatMap(child => parseNode(child));
  const paragraph = blocks[0].paragraph as notion.RichText;
  return notion.blockquote(paragraph.text as notion.RichText[]);
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
    const paragraph = item.children[0];
    if (paragraph === undefined || paragraph.type !== 'paragraph') {
      return [] as notion.Block[];
    }

    const text = paragraph.children.flatMap(child => parseInline(child));

    if (element.start !== null && element.start !== undefined) {
      return [notion.numberedListItem(text)];
    } else if (item.checked !== null && item.checked !== undefined) {
      return [notion.toDo(item.checked, text)];
    } else {
      return [notion.bulletedListItem(text)];
    }
  });
}

function parseNode(node: md.FlowContent): notion.Block[] {
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

    default:
      return [];
  }
}

export function parseBlocks(root: md.Root): notion.Block[] {
  return root.children.flatMap(parseNode);
}

export function parseRichText(root: md.Root): notion.RichText[] {
  if (root.children.length !== 1 || root.children[0].type !== 'paragraph') {
    throw new Error(`Unsupported markdown element: ${JSON.stringify(root)}`);
  }

  const paragraph = root.children[0];
  return paragraph.children.flatMap(child => parseInline(child));
}
