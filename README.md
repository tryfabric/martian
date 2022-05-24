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

---

Built with 💙 by the team behind [Fabric](https://tryfabric.com).

<img src="https://static.scarf.sh/a.png?x-pxid=79ae4e0a-7e48-4965-8a83-808c009aa47a" />

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
