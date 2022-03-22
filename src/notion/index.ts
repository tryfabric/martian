import {supportedCodeLang} from './common';
import lm from './languageMap.json';

export * from './blocks';
export * from './common';

export function parseCodeLanguage(
  lang?: string
): supportedCodeLang | undefined {
  return lang
    ? (lm as Record<string, supportedCodeLang>)[lang.toLowerCase()]
    : undefined;
}
