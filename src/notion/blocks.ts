/*
 * Notion SDK no longer exports types, so these are generic
 */
export interface Block {
  object?: string;
  type?: string;
  paragraph?: object;
  heading_1?: object;
  heading_2?: object;
  heading_3?: object;
  image?: object;
  quote?: object;
  bulleted_list_item?: object;
  numbered_list_item?: object;
}

export interface RichText {
  type: string;
  annotations: object;
  text: object;
}

export function paragraph(text: RichText[]): Block {
  return {
    object: 'block',
    type: 'paragraph',
    paragraph: {
      text: text,
    },
  } as Block;
}

export function code(text: RichText[]): Block {
  return {
    object: 'block',
    type: 'code',
    code: {
      text: text,
      language: 'javascript',
    },
  } as Block;
}

export function blockquote(text: RichText[]): Block {
  return {
    object: 'block',
    type: 'quote',
    quote: {
      text: text,
    },
  } as Block;
}

export function image(url: string): Block {
  return {
    object: 'block',
    type: 'image',
    image: {
      type: 'external',
      external: {
        url: url,
      },
    },
  } as Block;
}

export function table_of_contents(): Block {
  return {
    object: 'block',
    type: 'table_of_contents',
    table_of_contents: {},
  } as Block;
}

export function headingOne(text: RichText[]): Block {
  return {
    object: 'block',
    type: 'heading_1',
    heading_1: {
      text: text,
    },
  } as Block;
}

export function headingTwo(text: RichText[]): Block {
  return {
    object: 'block',
    type: 'heading_2',
    heading_2: {
      text: text,
    },
  } as Block;
}

export function headingThree(text: RichText[]): Block {
  return {
    object: 'block',
    type: 'heading_3',
    heading_3: {
      text: text,
    },
  } as Block;
}

export function bulletedListItem(text: RichText[]): Block {
  return {
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: {
      text: text,
    },
  } as Block;
}

export function numberedListItem(text: RichText[]): Block {
  return {
    object: 'block',
    type: 'numbered_list_item',
    numbered_list_item: {
      text: text,
    },
  } as Block;
}

export function toDo(checked: boolean, text: RichText[]): Block {
  return {
    object: 'block',
    type: 'to_do',
    to_do: {
      text: text,
      checked: checked,
    },
  } as Block;
}
