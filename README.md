# Martian: Markdown to Notion Parser

> Convert Markdown and GitHub Flavoured Markdown to Notion API Blocks and RichText

[![Node.js CI](https://github.com/rr-codes/martian/actions/workflows/ci.yml/badge.svg)](https://github.com/rr-codes/martian/actions/workflows/ci.yml)
[![Code Style: Google](https://img.shields.io/badge/code%20style-google-blueviolet.svg)](https://github.com/google/gts)

Martian is a Markdown parser to convert any Markdown content to Notion API block or RichText objects. It
uses [unified](https://github.com/unifiedjs/unified) to create a Markdown AST, then converts the AST into Notion
objects.

Designed to make using the Notion SDK and API easier.

### Supported Markdown Elements

* All inline elements (italics, bold, strikethrough, inline code, hyperlinks)
* Lists (ordered, unordered, checkboxes)
* All headers (header levels >= 3 are treated as header level 3)
* Code blocks (treated as paragraphs)
* Block quotes (treated as paragraphs)

## Usage

```ts
import {markdownToBlocks, markdownToRichText} from '@instantish/martian';
import type {RichText, Block} from '@notionhq/client/build/src/api-types';

const richText: RichText[] = markdownToRichText(`**Hello _world_**`);

// [
//   {
//     "type": "text",
//     "annotations": {
//       "bold": true,
//     },
//     "text": {
//       "content": "Hello "
//     }
//   },
//   {
//     "type": "text",
//     "annotations": {
//       "bold": true,
//       "italic": true,
//     },
//     "text": {
//       "content": "world"
//     }
//   }
// ]


const blocks: Block[] = markdownToBlocks(`
## this is a _heading 2_

* [x] todo list item
`)

// [
//   {
//     "object": "block",
//     "type": "heading_2",
//     "heading_2": {
//       "text": [
//         ...
//         {
//           "type": "text",
//           "annotations": {
//             "italic": true
//           }
//           "text": {
//             "content": "heading 2"
//           }
//         },
//       ]
//     }
//   },
//   {
//     "object": "block",
//     "type": "to_do",
//     "to_do": {
//       "text": [
//         {
//           "type": "text",
//           "annotations": {
//           },
//           "text": {
//             "content": "todo list item"
//           }
//         }
//       ],
//       "checked": true
//     }
//   }
// ]
```
