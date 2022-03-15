import type {RichText} from './blocks';

/**
 * The limits that the Notion API uses for property values.
 * @see https://developers.notion.com/reference/request-limits#limits-for-property-values
 */
export const LIMITS = {
  PAYLOAD_BLOCKS: 1000,
  RICH_TEXT_ARRAYS: 100,
  RICH_TEXT: {
    TEXT_CONTENT: 2000,
    LINK_URL: 1000,
    EQUATION_EXPRESSION: 1000,
  },
};

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
