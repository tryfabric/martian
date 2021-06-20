// From https://github.com/syntax-tree/mdast

import type {Node} from 'unist';

export interface Parent {
  children: MdastContent[];
}

export interface Literal {
  value: string;
}

export interface Root extends Parent {
  type: 'root';
  children: FlowContent[];
}

export interface Paragraph extends Parent {
  type: 'paragraph';
  children: PhrasingContent[];
}

export interface Heading extends Parent {
  type: 'heading';
  depth: 1 | 2 | 3 | 4 | 5 | 6;
  children: PhrasingContent[];
}

export interface ThematicBreak extends Node {
  type: 'thematicBreak';
}

export interface Blockquote extends Parent {
  type: 'blockquote';
  children: FlowContent[];
}

export interface List extends Parent {
  type: 'list';
  ordered?: boolean;
  start?: number;
  spread?: boolean;
  children: ListContent[];
}

export interface ListItem extends Parent {
  type: 'listitem';
  checked?: boolean | undefined | null;
  spread?: boolean;
  children: FlowContent[];
}

export interface HTML extends Literal {
  type: 'html';
}

export interface Code extends Literal {
  type: 'code';
  lang?: string;
  meta?: string;
}

export interface Definition extends Node {
  type: 'definition';
}

export interface Text extends Literal {
  type: 'text';
}

export interface Emphasis extends Parent {
  type: 'emphasis';
  children: PhrasingContent[];
}

export interface Strong extends Parent {
  type: 'strong';
  children: PhrasingContent[];
}

export interface Delete extends Parent {
  type: 'delete';
  children: PhrasingContent[];
}

export interface InlineCode extends Literal {
  type: 'inlineCode';
}

export interface Break extends Node {
  type: 'break';
}

export interface Link extends Parent, Resource {
  type: 'link';
  children: StaticPhrasingContent[];
}

export interface Image extends Node, Resource {
  type: 'image';
}

export interface LinkReference extends Parent {
  type: 'linkReference';
  children: StaticPhrasingContent[];
}

export interface ImageReference extends Node {
  type: 'imageReference';
}

export interface Resource {
  url: string;
  title?: string;
}

export interface Table extends Parent {
  type: 'table';
  align?: ('left' | 'right' | 'center')[];
  children: TableContent[];
}

export interface TableRow extends Parent {
  type: 'tableRow';
  children: RowContent[];
}

export interface TableCell extends Parent {
  type: 'tableCell';
  children: PhrasingContent[];
}

export type MdastContent =
  | FlowContent
  | ListContent
  | PhrasingContent
  | TableContent
  | RowContent;

export type FlowContent =
  | Blockquote
  | Code
  | Heading
  | HTML
  | List
  | ThematicBreak
  | Content
  | Table;

export type Content = Definition | Paragraph;

export type ListContent = ListItem;

export type PhrasingContent = Link | LinkReference | StaticPhrasingContent;

export type StaticPhrasingContent =
  | Break
  | Emphasis
  | HTML
  | Image
  | ImageReference
  | InlineCode
  | Strong
  | Text
  | Delete;

export type TableContent = TableRow;

export type RowContent = TableCell;
