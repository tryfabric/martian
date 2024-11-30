# Martian: Markdown to Notion Parser

Convert Markdown and GitHub Flavoured Markdown to Notion API Blocks and RichText.

[![Node.js CI](https://github.com/tryfabric/martian/actions/workflows/ci.yml/badge.svg)](https://github.com/tryfabric/martian/actions/workflows/ci.yml)
[![Code Style: Google](https://img.shields.io/badge/code%20style-google-blueviolet.svg)](https://github.com/google/gts)

Martian is a Markdown parser to convert any Markdown content to Notion API block or RichText objects. It
uses [unified](https://github.com/unifiedjs/unified) to create a Markdown AST, then converts the AST into Notion
objects.

Designed to make using the Notion SDK and API easier. Notion API version 1.0.

### Supported Markdown Elements

- All inline elements (italics, bold, strikethrough, inline code, hyperlinks, equations)
- Lists (ordered, unordered, checkboxes) - to any level of depth
- All headers (header levels >= 3 are treated as header level 3)
- Code blocks, with language highlighting support
- Block quotes
  - Supports GFM alerts (e.g. [!NOTE], [!TIP], [!IMPORTANT], [!WARNING], [!CAUTION])
  - Supports Notion callouts when blockquote starts with an emoji (optional, enabled with `enableEmojiCallouts`)
  - Automatically maps common emojis and alert types to appropriate background colors
  - Preserves formatting and nested blocks within callouts
- Tables
- Equations
- Images
  - Inline images are extracted from the paragraph and added afterwards (as these are not supported in notion)
  - Image urls are validated, if they are not valid as per the Notion external spec, they will be inserted as text for you to fix manually

## Usage

### Basic usage:

The package exports two functions, which you can import like this:

```ts
// JS
const {markdownToBlocks, markdownToRichText} = require('@tryfabric/martian');
// TS
import {markdownToBlocks, markdownToRichText} from '@tryfabric/martian';
```

Here are couple of examples with both of them:

```ts
markdownToRichText(`**Hello _world_**`);
```

<details>
<summary>Result</summary>
<pre>
[
  {
    "type": "text",
    "annotations": {
      "bold": true,
      "strikethrough": false,
      "underline": false,
      "italic": false,
      "code": false,
      "color": "default"
    },
    "text": {
      "content": "Hello "
    }
  },
  {
    "type": "text",
    "annotations": {
      "bold": true,
      "strikethrough": false,
      "underline": false,
      "italic": true,
      "code": false,
      "color": "default"
    },
    "text": {
      "content": "world"
    }
  }
]
</pre>
</details>

```ts
markdownToBlocks(`
hello _world_ 
*** 
## heading2
* [x] todo

> 📘 **Note:** Important _information_

> Some other blockquote
`);
```

<details>
<summary>Result</summary>
<pre>
[
  {
    "object": "block",
    "type": "paragraph",
    "paragraph": {
      "rich_text": [
        {
          "type": "text",
          "annotations": {
            "bold": false,
            "strikethrough": false,
            "underline": false,
            "italic": false,
            "code": false,
            "color": "default"
          },
          "text": {
            "content": "hello "
          }
        },
        {
          "type": "text",
          "annotations": {
            "bold": false,
            "strikethrough": false,
            "underline": false,
            "italic": true,
            "code": false,
            "color": "default"
          },
          "text": {
            "content": "world"
          }
        }
      ]
    }
  },
  {
    "object": "block",
    "type": "divider",
    "divider": {}
  },
  {
    "object": "block",
    "type": "heading_2",
    "heading_2": {
      "rich_text": [
        {
          "type": "text",
          "annotations": {
            "bold": false,
            "strikethrough": false,
            "underline": false,
            "italic": false,
            "code": false,
            "color": "default"
          },
          "text": {
            "content": "heading2"
          }
        }
      ]
    }
  },
  {
    "object": "block",
    "type": "to_do",
    "to_do": {
      "rich_text": [
        {
          "type": "text",
          "annotations": {
            "bold": false,
            "strikethrough": false,
            "underline": false,
            "italic": false,
            "code": false,
            "color": "default"
          },
          "text": {
            "content": "todo"
          }
        }
      ],
      "checked": true
    }
  },
  {
    "type": "callout",
    "callout": {
      "rich_text": [
        {
          "type": "text",
          "text": {
            "content": "Note:"
          },
          "annotations": {
            "bold": true,
            "strikethrough": false,
            "underline": false,
            "italic": false,
            "code": false,
            "color": "default"
          }
        },
        {
          "type": "text",
          "text": {
            "content": " Important "
          }
        },
        {
          "type": "text",
          "text": {
            "content": "information"
          },
          "annotations": {
            "bold": false,
            "strikethrough": false,
            "underline": false,
            "italic": true,
            "code": false,
            "color": "default"
          }
        }
      ],
      "icon": {
        "type": "emoji",
        "emoji": "📘"
      },
      "color": "blue_background"
    }
  },
  {
    "type": "quote",
    "quote": {
      "rich_text": [
        {
          "type": "text",
          "text": {
            "content": "Some other blockquote"
          },
          "annotations": {
            "bold": false,
            "strikethrough": false,
            "underline": false,
            "italic": false,
            "code": false,
            "color": "default"
          }
        }
      ]
    }
  }
]
</pre>
</details>

### Working with blockquotes

Martian supports three types of blockquotes:

1. Standard blockquotes:

```md
> This is a regular blockquote
> It can span multiple lines
```

2. GFM alerts (based on [GFM Alerts](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#alerts)):

```md
> [!NOTE]
> Important information that users should know

> [!WARNING]
> Critical information that needs attention
```

3. Emoji-style callouts (optional) (based on [ReadMe's markdown callouts](https://docs.readme.com/rdmd/docs/callouts)):

```md
> 📘 **Note:** This is a callout with a blue background
> It supports all markdown formatting and can span multiple lines

> ❗ **Warning:** This is a callout with a red background
> Perfect for important warnings
```

#### GFM Alerts

GFM alerts are automatically converted to Notion callouts with appropriate icons and colors:

- NOTE (📘, blue): Useful information that users should know
- TIP (💡, green): Helpful advice for doing things better
- IMPORTANT (☝️, purple): Key information users need to know
- WARNING (⚠️, yellow): Urgent info that needs immediate attention
- CAUTION (❗, red): Advises about risks or negative outcomes

#### Emoji-style Callouts

By default, emoji-style callouts are disabled. You can enable them using the `enableEmojiCallouts` option:

```ts
const options = {
  enableEmojiCallouts: true,
};
```

When enabled, callouts are detected when a blockquote starts with an emoji. The emoji determines the callout's background color. The current supported color mappings are:

- 📘 (blue): Perfect for notes and information
- 👍 (green): Success messages and tips
- ❗ (red): Warnings and important notices
- 🚧 (yellow): Work in progress or caution notices

All other emojis will have a default background color. The supported emoji color mappings can be expanded easily if needed.

If a blockquote doesn't match either GFM alert syntax or emoji-style callout syntax (when enabled), it will be rendered as a Notion quote block.

##### Examples

Standard blockquote:

```ts
markdownToBlocks('> A regular blockquote');
```

<details>
<summary>Result</summary>
<pre>
[
  {
    "object": "block",
    "type": "quote",
    "quote": {
      "rich_text": [
        {
          "type": "text",
          "text": {
            "content": "A regular blockquote"
          }
        }
      ]
    }
  }
]
</pre>
</details>

GFM alert:

```ts
markdownToBlocks('> [!NOTE]\n> Important information');
```

<details>
<summary>Result</summary>
<pre>
[
  {
    "object": "block",
    "type": "callout",
    "callout": {
      "rich_text": [
        {
          "type": "text",
          "text": {
            "content": "Note"
          }
        }
      ],
      "icon": {
        "type": "emoji",
        "emoji": "ℹ️"
      },
      "color": "blue_background",
      "children": [
        {
          "type": "paragraph",
          "paragraph": {
            "rich_text": [
              {
                "type": "text",
                "text": {
                  "content": "Important information"
                }
              }
            ]
          }
        }
      ]
    }
  }
]
</pre>
</details>

Emoji-style callout (with `enableEmojiCallouts: true`):

```ts
markdownToBlocks('> 📘 Note: Important information', {
  enableEmojiCallouts: true,
});
```

<details>
<summary>Result</summary>
<pre>
[
  {
    "object": "block",
    "type": "callout",
    "callout": {
      "rich_text": [
        {
          "type": "text",
          "text": {
            "content": "Note: Important information"
          }
        }
      ],
      "icon": {
        "type": "emoji",
        "emoji": "📘"
      },
      "color": "blue_background"
    }
  }
]
</pre>
</details>

### Working with Notion's limits

Sometimes a Markdown input would result in an output that would be rejected by the Notion API: here are some options to deal with that.

#### An item exceeds the children or character limit

By default, the package will try to resolve these kind of issues by re-distributing the content to multiple blocks: when that's not possible, `martian` will truncate the output to avoid your request resulting in an error.  
If you want to disable this kind of behavior, you can use this option:

```ts
const options = {
  notionLimits: {
    truncate: false,
  },
};

markdownToBlocks('input', options);
markdownToRichText('input', options);
```

#### Manually handling errors related to Notions's limits

You can set a callback for when one of the resulting items would exceed Notion's limits. Please note that this function will be called regardless of whether the final output will be truncated.

```ts
const options = {
  notionLimits: {
    // truncate: true, // by default
    onError: (err: Error) => {
      // Something has appened!
      console.error(err);
    },
  },
};

markdownToBlocks('input', options);
markdownToRichText('input', options);
```

### Working with images

If an image as an invalid URL, the Notion API will reject the whole request: `martian` prevents this issue by converting images with invalid links into text, so that request are successfull and you can fix the links later.  
If you want to disable this kind of behavior, you can use this option:

```ts
const options = {
  strictImageUrls: false,
};
```

Default behavior:

```ts
markdownToBlocks('![](InvalidURL)');
```

<details>
<summary>Result</summary>
<pre>
[
  {
    "object": "block",
    "type": "paragraph",
    "paragraph": {
      "rich_text": [
        {
          "type": "text",
          "annotations": {
            "bold": false,
            "strikethrough": false,
            "underline": false,
            "italic": false,
            "code": false,
            "color": "default"
          },
          "text": {
            "content": "InvalidURL"
          }
        }
      ]
    }
  }
]
</pre>
</details>

`strictImageUrls` disabled:

```ts
markdownToBlocks('![](InvalidURL)', {
  strictImageUrls: false,
});
```

<details>
<summary>Result</summary>
<pre>
[
  {
    "object": "block",
    "type": "image",
    "image": {
      "type": "external",
      "external": {
        "url": "InvalidURL"
      }
    }
  }
]
</pre>
</details>

### Non-inline elements when parsing rich text

By default, if the text provided to `markdownToRichText` would result in one or more non-inline elements, the package will ignore those and only parse paragraphs.  
You can make the package throw an error when a non-inline element is detected by setting the `nonInline` option to `'throw'`.

Default behavior:

```ts
markdownToRichText('# Header\nAbc', {
  // nonInline: 'ignore', // Default
});
```

<details>
<summary>Result</summary>
<pre>
[
  {
    type: 'text',
    annotations: {
      bold: false,
      strikethrough: false,
      underline: false,
      italic: false,
      code: false,
      color: 'default'
    },
    text: { content: 'Abc', link: undefined }
  }
]
</pre>
</details>

Throw an error:

```ts
markdownToRichText('# Header\nAbc', {
  nonInline: 'throw',
});
```

<details>
<summary>Result</summary>
<pre>
Error: Unsupported markdown element: {"type":"heading","depth":1,"children":[{"type":"text","value":"Header","position":{"start":{"line":1,"column":3,
"offset":2},"end":{"line":1,"column":9,"offset":8}}}],"position":{"start":{"line":1,"column":1,"offset":0},"end":{"line":1,"column":9,"offset":8}}}  
</pre>
</details>

---

Built with 💙 by the team behind [Fabric](https://tryfabric.com).

<img src="https://static.scarf.sh/a.png?x-pxid=79ae4e0a-7e48-4965-8a83-808c009aa47a" />
