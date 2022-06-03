import {
  CodeLang,
  Constants,
  isCodeLang,
  NotionRequest,
} from '@tryfabric/notion-utils';
import lm from './languageMap.json';

export * from '@tryfabric/notion-utils';
export const {LIMITS} = Constants;
export type Block = NotionRequest.Block;
export type RichText = NotionRequest.RichText;

export function parseCodeLanguage(lang?: string): CodeLang | undefined {
  return lang
    ? isCodeLang(lang)
      ? lang
      : (lm as Record<string, CodeLang>)[lang.toLowerCase()]
    : undefined;
}
