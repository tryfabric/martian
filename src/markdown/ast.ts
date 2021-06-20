import type {
  Blockquote,
  Code,
  Delete,
  Emphasis,
  FlowContent,
  Heading,
  InlineCode,
  Link,
  List,
  ListContent,
  ListItem,
  Paragraph,
  PhrasingContent,
  Root,
  RowContent,
  StaticPhrasingContent,
  Strong,
  Table,
  TableContent,
  Text,
  ThematicBreak,
} from './types';

export function text(value: string): Text {
  return {
    type: 'text',
    value: value,
  };
}

export function emphasis(...children: PhrasingContent[]): Emphasis {
  return {
    type: 'emphasis',
    children: children,
  };
}

export function strong(...children: PhrasingContent[]): Strong {
  return {
    type: 'strong',
    children: children,
  };
}

export function inlineCode(value: string): InlineCode {
  return {
    type: 'inlineCode',
    value: value,
  };
}

export function paragraph(...children: PhrasingContent[]): Paragraph {
  return {
    type: 'paragraph',
    children: children,
  };
}

export function root(...children: FlowContent[]): Root {
  return {
    type: 'root',
    children: children,
  };
}

export function link(url: string, ...children: StaticPhrasingContent[]): Link {
  return {
    type: 'link',
    children: children,
    url: url,
  };
}

export function thematicBreak(): ThematicBreak {
  return {
    type: 'thematicBreak',
  };
}

export function heading(
  depth: 1 | 2 | 3 | 4 | 5 | 6,
  ...children: PhrasingContent[]
): Heading {
  return {
    type: 'heading',
    depth: depth,
    children: children,
  };
}

export function code(value: string, lang: string | undefined): Code {
  return {
    type: 'code',
    lang: lang,
    value: value,
  };
}

export function blockquote(...children: FlowContent[]): Blockquote {
  return {
    type: 'blockquote',
    children: children,
  };
}

export function listItem(...children: FlowContent[]): ListItem {
  return {
    type: 'listitem',
    children: children,
  };
}

export function checkedListItem(
  checked: boolean,
  ...children: FlowContent[]
): ListItem {
  return {
    type: 'listitem',
    checked: checked,
    children: children,
  };
}

export function unorderedList(...children: ListContent[]): List {
  return {
    type: 'list',
    children: children,
    ordered: false,
  };
}

export function orderedList(...children: ListContent[]): List {
  return {
    type: 'list',
    children: children,
    start: 0,
    ordered: true,
  };
}

export function strikethrough(...children: PhrasingContent[]): Delete {
  return {
    type: 'delete',
    children: children,
  };
}

export function table(...children: TableContent[]): Table {
  return {
    type: 'table',
    children: children,
  };
}

export function tableRow(...children: RowContent[]): TableContent {
  return {
    type: 'tableRow',
    children: children,
  };
}

export function tableCell(...children: PhrasingContent[]): RowContent {
  return {
    type: 'tableCell',
    children: children,
  };
}
