# Martian: Markdown to Notion Parser

> NOTE: Please use the new NPM package at [@tryfabric/martian](https://www.npmjs.com/package/@tryfabric/martian).

Convert Markdown and GitHub Flavoured Markdown to Notion API Blocks and RichText.

[![Node.js CI](https://github.com/instantish/martian/actions/workflows/ci.yml/badge.svg)](https://github.com/instantish/martian/actions/workflows/ci.yml)
[![Code Style: Google](https://img.shields.io/badge/code%20style-google-blueviolet.svg)](https://github.com/google/gts)

Martian is a Markdown parser to convert any Markdown content to Notion API block or RichText objects. It
uses [unified](https://github.com/unifiedjs/unified) to create a Markdown AST, then converts the AST into Notion
objects.

Designed to make using the Notion SDK and API easier.  Notion API version 0.4.5.

### Supported Markdown Elements

* All inline elements (italics, bold, strikethrough, inline code, hyperlinks)
* Lists (ordered, unordered, checkboxes) - to any level of depth
* All headers (header levels >= 3 are treated as header level 3)
* Code blocks
* Block quotes
* Images (where the image is the first element in the paragraph and it has a valid full URL)

## Unsupported Markdown Elements

*tables*: Tables can be imported in an [unsupported mode](https://developers.notion.com/reference/block) if you add a flag to the parser.

First, the default mode - it ignores the tables:

```ts
const allowUnsupportedObjectType = false;
const blocks: Block[] = markdownToBlocks(`
# Table

| First Header  | Second Header |
| ------------- | ------------- |
| Content Cell  | Content Cell  |
| Content Cell  | Content Cell  |
`, allowUnsupportedObjectType);

// [
//   {
//     "object": "block",
//     "type": "heading_1",
//     "heading_1": {
//       "text": [
//         {
//           "type": "text",
//           "annotations": {
//             "bold": false,
//             "strikethrough": false,
//             "underline": false,
//             "italic": false,
//             "code": false,
//             "color": "default"
//           },
//           "text": {
//             "content": "Table"
//           }
//         }
//       ]
//     }
//   }
// ]
```

Next, with unsupported flag = true (note the `annotations` have been removed from the returned object to make it easier to see what is going on):


```ts
const allowUnsupportedObjectType = true;
const blocks: Block[] = markdownToBlocks(`
# Table

| First Header  | Second Header |
| ------------- | ------------- |
| Content Cell  | Content Cell  |
| Content Cell  | Content Cell  |
`, allowUnsupportedObjectType)

 [
//   {
//     "object": "block",
//     "type": "heading_1",
//     "heading_1": {
//       "text": [
//         {
//           "type": "text",
//           "text": {
//             "content": "Table"
//           }
//         }
//       ]
//     }
//   },
//   {
//     "object": "unsupported",
//     "type": "table",
//     "table": {
//       "children": [
//         {
//           "object": "unsupported",
//           "type": "table_row",
//           "table_row": {
//             "children": [
//               {
//                 "object": "unsupported",
//                 "type": "table_cell",
//                 "table_cell": {
//                   "children": [
//                     {
//                       "type": "text",
//                       "text": {
//                         "content": "First Header"
//                       }
//                     }
//                   ]
//                 }
//               },
//               {
//                 "object": "unsupported",
//                 "type": "table_cell",
//                 "table_cell": {
//                   "children": [
//                     {
//                       "type": "text",
//                       "text": {
//                         "content": "Second Header"
//                       }
//                     }
//                   ]
//                 }
//               }
//             ]
//           }
//         },
//         {
//           "object": "unsupported",
//           "type": "table_row",
//           "table_row": {
//             "children": [
//               {
//                 "object": "unsupported",
//                 "type": "table_cell",
//                 "table_cell": {
//                   "children": [
//                     {
//                       "type": "text",
//                       "text": {
//                         "content": "Content Cell"
//                       }
//                     }
//                   ]
//                 }
//               },
//               {
//                 "object": "unsupported",
//                 "type": "table_cell",
//                 "table_cell": {
//                   "children": [
//                     {
//                       "type": "text",
//                       "text": {
//                         "content": "Content Cell"
//                       }
//                     }
//                   ]
//                 }
//               }
//             ]
//           }
//         },
//         {
//           "object": "unsupported",
//           "type": "table_row",
//           "table_row": {
//             "children": [
//               {
//                 "object": "unsupported",
//                 "type": "table_cell",
//                 "table_cell": {
//                   "children": [
//                     {
//                       "type": "text",
//                       "text": {
//                         "content": "Content Cell"
//                       }
//                     }
//                   ]
//                 }
//               },
//               {
//                 "object": "unsupported",
//                 "type": "table_cell",
//                 "table_cell": {
//                   "children": [
//                     {
//                       "type": "text",
//                       "text": {
//                         "content": "Content Cell"
//                       }
//                     }
//                   ]
//                 }
//               }
//             ]
//           }
//         }
//       ]
//     }
//   }
// ]
```

Note that if you send this document to Notion with the current version of the API it *will* fail, but this allows you to pre-parse the blocks in your client library, and do something with the tables.  In one example, the tables are being parsed out of the blocks, databases being created, that are then linked back to the imported page:  https://github.com/infinitaslearning/notionater/blob/main/index.js#L81-L203


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

---

Built with 💙 by the team behind [Fabric](https://tryfabric.com).

<img src="https://static.scarf.sh/a.png?x-pxid=79ae4e0a-7e48-4965-8a83-808c009aa47a" />
