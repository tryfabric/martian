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
  type?: 'text' | 'equation'; // 'mention' is not supported
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
  const annotations: RichText['annotations'] = {
    bold: false,
    strikethrough: false,
    underline: false,
    italic: false,
    code: false,
    color: 'default' as const,
    ...((options.annotations as RichText['annotations']) || {}),
  };

  if (options.type === 'equation')
    return {
      type: 'equation',
      annotations,
      equation: {
        expression: content,
      },
    };
  else
    return {
      type: 'text',
      annotations,
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

export const SUPPORTED_CODE_BLOCK_LANGUAGES = [
  'abap',
  'arduino',
  'bash',
  'basic',
  'c',
  'clojure',
  'coffeescript',
  'c++',
  'c#',
  'css',
  'dart',
  'diff',
  'docker',
  'elixir',
  'elm',
  'erlang',
  'flow',
  'fortran',
  'f#',
  'gherkin',
  'glsl',
  'go',
  'graphql',
  'groovy',
  'haskell',
  'html',
  'java',
  'javascript',
  'json',
  'julia',
  'kotlin',
  'latex',
  'less',
  'lisp',
  'livescript',
  'lua',
  'makefile',
  'markdown',
  'markup',
  'matlab',
  'mermaid',
  'nix',
  'objective-c',
  'ocaml',
  'pascal',
  'perl',
  'php',
  'plain text',
  'powershell',
  'prolog',
  'protobuf',
  'python',
  'r',
  'reason',
  'ruby',
  'rust',
  'sass',
  'scala',
  'scheme',
  'scss',
  'shell',
  'sql',
  'swift',
  'typescript',
  'vb.net',
  'verilog',
  'vhdl',
  'visual basic',
  'webassembly',
  'xml',
  'yaml',
  'java/c/c++/c#',
] as const;

export type supportedCodeLang = typeof SUPPORTED_CODE_BLOCK_LANGUAGES[number];

export function isSupportedCodeLang(lang: string): lang is supportedCodeLang {
  return (SUPPORTED_CODE_BLOCK_LANGUAGES as readonly string[]).includes(lang);
}
