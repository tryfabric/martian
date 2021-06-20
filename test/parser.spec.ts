import * as md from '../src/markdown';
import {text} from '../src/markdown';
import * as notion from '../src/notion';
import {parseBlocks, parseRichText} from '../src/parser/internal';

describe('gfm parser', () => {
  it('should parse paragraph with nested annotations', () => {
    const ast = md.root(
      md.paragraph(
        md.text('Hello '),
        md.emphasis(md.text('world '), md.strong(md.text('foo'))),
        md.text('! '),
        md.inlineCode('code')
      )
    );

    const actual = parseBlocks(ast);

    const expected = [
      notion.paragraph([
        notion.richText('Hello '),
        notion.richText('world ', {
          annotations: {italic: true},
        }),
        notion.richText('foo', {
          annotations: {italic: true, bold: true},
        }),
        notion.richText('! '),
        notion.richText('code', {
          annotations: {code: true},
        }),
      ]),
    ];

    expect(actual).toStrictEqual(expected);
  });

  it('should parse text with hrefs and annotations', () => {
    const ast = md.root(
      md.paragraph(
        md.text('hello world '),
        md.link(
          'https://example.com',
          md.text('this is a '),
          md.emphasis(md.text('url'))
        ),
        md.text(' end')
      )
    );

    const actual = parseBlocks(ast);

    const expected = [
      notion.paragraph([
        notion.richText('hello world '),
        notion.richText('this is a ', {
          url: 'https://example.com',
        }),
        notion.richText('url', {
          annotations: {italic: true},
          url: 'https://example.com',
        }),
        notion.richText(' end'),
      ]),
    ];

    expect(actual).toStrictEqual(expected);
  });

  it('should parse thematic breaks', () => {
    const ast = md.root(
      md.paragraph(md.text('hello')),
      md.thematicBreak(),
      md.paragraph(md.text('world'))
    );

    const actual = parseBlocks(ast);

    const expected = [
      notion.paragraph([notion.richText('hello')]),
      notion.paragraph([notion.richText('world')]),
    ];

    expect(actual).toStrictEqual(expected);
  });

  it('should parse headings', () => {
    const ast = md.root(
      md.heading(1, md.text('heading1')),
      md.heading(2, md.text('heading2')),
      md.heading(3, md.text('heading3')),
      md.heading(4, md.text('heading4'))
    );

    const actual = parseBlocks(ast);

    const expected = [
      notion.headingOne([notion.richText('heading1')]),
      notion.headingTwo([notion.richText('heading2')]),
      notion.headingThree([notion.richText('heading3')]),
      notion.headingThree([notion.richText('heading4')]),
    ];

    expect(actual).toStrictEqual(expected);
  });

  it('should parse code block', () => {
    const ast = md.root(
      md.paragraph(md.text('hello')),
      md.code('public class Foo {}', 'java')
    );

    const actual = parseBlocks(ast);

    const expected = [
      notion.paragraph([notion.richText('hello')]),
      notion.paragraph([
        notion.richText('public class Foo {}', {
          annotations: {code: true},
        }),
      ]),
    ];

    expect(actual).toStrictEqual(expected);
  });

  it('should parse block quote', () => {
    const ast = md.root(
      md.blockquote(
        md.heading(1, md.text('hello '), md.emphasis(md.text('world')))
      )
    );

    const actual = parseBlocks(ast);

    const expected = [
      notion.headingOne([
        notion.richText('hello '),
        notion.richText('world', {
          annotations: {italic: true},
        }),
      ]),
    ];

    expect(actual).toStrictEqual(expected);
  });

  it('should parse list', () => {
    const ast = md.root(
      md.paragraph(md.text('hello')),
      md.unorderedList(
        md.listItem(md.paragraph(md.text('a'))),
        md.listItem(md.paragraph(md.emphasis(md.text('b')))),
        md.listItem(md.paragraph(md.strong(md.text('c'))))
      ),
      md.orderedList(md.listItem(md.paragraph(md.text('d'))))
    );

    const actual = parseBlocks(ast);

    const expected = [
      notion.paragraph([notion.richText('hello')]),
      notion.bulletedListItem([notion.richText('a')]),
      notion.bulletedListItem([
        notion.richText('b', {annotations: {italic: true}}),
      ]),
      notion.bulletedListItem([
        notion.richText('c', {annotations: {bold: true}}),
      ]),
      notion.numberedListItem([notion.richText('d')]),
    ];

    expect(actual).toStrictEqual(expected);
  });

  it('should parse github extensions', () => {
    const ast = md.root(
      md.paragraph(
        md.link('https://example.com', md.text('https://example.com'))
      ),
      md.paragraph(md.strikethrough(md.text('strikethrough content'))),
      md.table(
        md.tableRow(
          md.tableCell(md.text('a')),
          md.tableCell(md.text('b')),
          md.tableCell(md.text('c')),
          md.tableCell(md.text('d'))
        )
      ),
      md.unorderedList(
        md.checkedListItem(false, md.paragraph(md.text('to do'))),
        md.checkedListItem(true, md.paragraph(md.text('done')))
      )
    );

    const actual = parseBlocks(ast);

    const expected = [
      notion.paragraph([
        notion.richText('https://example.com', {
          url: 'https://example.com',
        }),
      ]),
      notion.paragraph([
        notion.richText('strikethrough content', {
          annotations: {strikethrough: true},
        }),
      ]),
      notion.toDo(false, [notion.richText('to do')]),
      notion.toDo(true, [notion.richText('done')]),
    ];

    expect(actual).toStrictEqual(expected);
  });

  it('should parse rich text', () => {
    const ast = md.root(
      md.paragraph(
        md.text('a'),
        md.strong(md.emphasis(md.text('b')), md.text('c')),
        md.link('https://example.com', text('d'))
      )
    );

    const actual = parseRichText(ast);

    const expected = [
      notion.richText('a'),
      notion.richText('b', {annotations: {italic: true, bold: true}}),
      notion.richText('c', {annotations: {bold: true}}),
      notion.richText('d', {url: 'https://example.com'}),
    ];

    expect(actual).toStrictEqual(expected);
  });
});
