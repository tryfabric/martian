import unified from 'unified';
import markdown from 'remark-parse';
import * as notion from './notion';
import {parseBlocks} from './parser/internal';
import * as md from './markdown';
import gfm from 'remark-gfm';

/**
 * Parses Markdown content into Notion Blocks.
 * - Supports all heading types (heading depths 4, 5, 6 are treated as 3 for Notion)
 * - Supports numbered lists, bulleted lists, to-do lists
 * - Supports italics, bold, strikethrough, inline code, hyperlinks
 *
 * Per Notion limitations, these markdown attributes are not supported:
 * - Tables (removed)
 * - HTML tags (removed)
 * - Thematic breaks (removed)
 * - Code blocks (treated as paragraph)
 * - Block quotes (treated as paragraph)
 *
 * Supports GitHub-flavoured Markdown.
 *
 * @param body any Markdown or GFM content
 */
export function markdownToBlocks(body: string): notion.Block[] {
  const root = unified().use(markdown).use(gfm).parse(body);

  return parseBlocks(root as unknown as md.Root);
}
