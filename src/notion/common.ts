import type {RichText} from './blocks';

export interface RichTextOptions {
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
    color?: string;
  };
  url?: string;
}

export function richText(
  content: string,
  options: RichTextOptions = {}
): RichText {
  const annotations = options.annotations ?? {};
  return {
    type: 'text',
    annotations: {
      bold: false,
      strikethrough: false,
      underline: false,
      italic: false,
      code: false,
      color: 'default',
      ...annotations,
    },
    text: {
      content: content,
      link: options.url
        ? {
            type: 'url',
            url: options.url,
          }
        : undefined,
    },
  } as RichText;
}
