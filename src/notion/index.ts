import {supportedCodeLang, SUPPORTED_EMOJI_COLOR_MAP} from './common';
import type {EmojiRequest, ApiColor} from './blocks';
import lm from './languageMap.json';

export * from './blocks';
export * from './common';

export function parseCodeLanguage(
  lang?: string,
): supportedCodeLang | undefined {
  return lang
    ? (lm as Record<string, supportedCodeLang>)[lang.toLowerCase()]
    : undefined;
}

/**
 * Parses text to find a leading emoji and determines its corresponding Notion callout color
 * Uses Unicode 15.0 emoji pattern to detect emoji at start of text
 * @returns Emoji and color data if text starts with an emoji, null otherwise
 */
export function parseCalloutEmoji(
  text: string,
): {emoji: EmojiRequest; color: ApiColor} | null {
  if (!text) return null;

  // Get the first line of text
  const firstLine = text.split('\n')[0];

  // Match text that starts with an emoji (with optional variation selector)
  const match = firstLine.match(
    /^([\p{Emoji_Presentation}\p{Extended_Pictographic}][\u{FE0F}\u{FE0E}]?).*$/u,
  );

  if (!match) return null;

  const emoji = match[1];

  return {
    emoji: emoji as EmojiRequest,
    color: SUPPORTED_EMOJI_COLOR_MAP[emoji as EmojiRequest] || 'default',
  };
}
