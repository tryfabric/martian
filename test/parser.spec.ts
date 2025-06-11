import * as md from '../src/markdown';
import {text} from '../src/markdown';
import * as notion from '../src/notion';
import {parseBlocks, parseRichText} from '../src/parser/internal';

describe('gfm parser', () => {
  const options = {allowUnsupportedObjectType: false, strictImageUrls: true};
  it('should parse paragraph with nested annotations', () => {
    const ast = md.root(
      md.paragraph(
        md.text('Hello '),
        md.emphasis(md.text('world '), md.strong(md.text('foo'))),
        md.text('! '),
        md.inlineCode('code'),
      ),
    );

    const actual = parseBlocks(ast, options);

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
          md.emphasis(md.text('url')),
        ),
        md.text(' end'),
      ),
    );

    const actual = parseBlocks(ast, options);

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
      md.paragraph(md.text('world')),
    );

    const actual = parseBlocks(ast, options);

    const expected = [
      notion.paragraph([notion.richText('hello')]),
      notion.divider(),
      notion.paragraph([notion.richText('world')]),
    ];

    expect(actual).toStrictEqual(expected);
  });

  it('should parse headings', () => {
    const ast = md.root(
      md.heading(1, md.text('heading1')),
      md.heading(2, md.text('heading2')),
      md.heading(3, md.text('heading3')),
      md.heading(4, md.text('heading4')),
    );

    const actual = parseBlocks(ast, options);

    const expected = [
      notion.headingOne([notion.richText('heading1')]),
      notion.headingTwo([notion.richText('heading2')]),
      notion.headingThree([notion.richText('heading3')]),
      notion.headingThree([notion.richText('heading4')]),
    ];

    expect(actual).toStrictEqual(expected);
  });

  it('should parse code block and set the language to plain text if none is provided', () => {
    const ast = md.root(
      md.paragraph(md.text('hello')),
      md.code('const foo = () => {}', undefined),
    );

    const actual = parseBlocks(ast);

    const expected = [
      notion.paragraph([notion.richText('hello')]),
      notion.code([notion.richText('const foo = () => {}')], 'plain text'),
    ];
    expect(actual).toStrictEqual(expected);
  });

  it('should parse code block and set the proper language', () => {
    const ast = md.root(
      md.paragraph(md.text('hello')),
      md.code('public class Foo {}', 'java'),
    );

    const actual = parseBlocks(ast, options);

    const expected = [
      notion.paragraph([notion.richText('hello')]),
      notion.code([notion.richText('public class Foo {}')], 'java'),
    ];

    expect(actual).toStrictEqual(expected);
  });

  it('should parse code block and set the language to plain text if it is not supported by Notion', () => {
    const ast = md.root(
      md.paragraph(md.text('hello')),
      md.code('const foo = () => {}', 'not-supported'),
    );

    const actual = parseBlocks(ast);

    const expected = [
      notion.paragraph([notion.richText('hello')]),
      notion.code([notion.richText('const foo = () => {}')], 'plain text'),
    ];

    expect(actual).toStrictEqual(expected);
  });

  it('should parse block quote', () => {
    const ast = md.root(
      md.blockquote(
        md.heading(1, md.text('hello'), md.emphasis(md.text('world'))),
      ),
    );

    const actual = parseBlocks(ast, options);

    const expected = [
      notion.blockquote(
        [],
        [
          notion.headingOne([
            notion.richText('hello'),
            notion.richText('world', {
              annotations: {italic: true},
            }),
          ]),
        ],
      ),
    ];

    expect(actual).toStrictEqual(expected);
  });

  it('should parse callout with emoji and formatting', () => {
    const ast = md.root(
      md.blockquote(
        md.paragraph(
          md.text('📘 '),
          md.strong(md.text('Note:')),
          md.text(' Important '),
          md.emphasis(md.text('information')),
        ),
      ),
    );

    const actual = parseBlocks(ast, {
      ...options,
      enableEmojiCallouts: true,
    });

    const expected = [
      notion.callout(
        [
          notion.richText('Note:', {annotations: {bold: true}}),
          notion.richText(' Important '),
          notion.richText('information', {annotations: {italic: true}}),
        ],
        '📘',
        'blue_background',
        [],
      ),
    ];

    expect(actual).toStrictEqual(expected);
  });

  it('should parse callout with children blocks', () => {
    const ast = md.root(
      md.blockquote(
        md.paragraph(md.text('🚧 Under Construction')),
        md.paragraph(md.text('More details:')),
        md.unorderedList(
          md.listItem(md.paragraph(md.text('Work in progress'))),
        ),
      ),
    );

    const actual = parseBlocks(ast, {
      ...options,
      enableEmojiCallouts: true,
    });

    const expected = [
      notion.callout(
        [notion.richText('Under Construction')],
        '🚧',
        'yellow_background',
        [
          notion.paragraph([notion.richText('More details:')]),
          notion.bulletedListItem([notion.richText('Work in progress')], []),
        ],
      ),
    ];

    expect(actual).toStrictEqual(expected);
  });

  it('should parse list', () => {
    const ast = md.root(
      md.paragraph(md.text('hello')),
      md.unorderedList(
        md.listItem(md.paragraph(md.text('a'))),
        md.listItem(md.paragraph(md.emphasis(md.text('b')))),
        md.listItem(md.paragraph(md.strong(md.text('c')))),
      ),
      md.orderedList(md.listItem(md.paragraph(md.text('d')))),
    );

    const actual = parseBlocks(ast, options);

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

  it('should split paragraphs on hard line breaks', () => {
    // Simulate markdown where a line ends with two spaces followed by \n, which renders as a hard line break.
    // In the mdast AST this is represented as a `break` node within the paragraph.
    const br: md.Break = {type: 'break'} as md.Break;

    const ast = md.root(
      md.paragraph(
        md.text('You can '),
        md.emphasis(md.text('italicize')),
        md.text(' or '),
        md.strong(md.text('bold')),
        md.text(' text.'),
        br,
        md.text('This is the second line of text'),
      ),
    );

    const actual = parseBlocks(ast, options);

    const expected = [
      notion.paragraph([
        notion.richText('You can '),
        notion.richText('italicize', {annotations: {italic: true}}),
        notion.richText(' or '),
        notion.richText('bold', {annotations: {bold: true}}),
        notion.richText(' text.'),
      ]),
      notion.paragraph([notion.richText('This is the second line of text')]),
    ];

    expect(actual).toStrictEqual(expected);
  });

  it('should parse github extensions', () => {
    const ast = md.root(
      md.paragraph(
        md.link('https://example.com', md.text('https://example.com')),
      ),
      md.paragraph(md.strikethrough(md.text('strikethrough content'))),
      md.table(
        md.tableRow(
          md.tableCell(md.text('a')),
          md.tableCell(md.text('b')),
          md.tableCell(md.text('c')),
          md.tableCell(md.text('d')),
        ),
      ),
      md.unorderedList(
        md.checkedListItem(false, md.paragraph(md.text('to do'))),
        md.checkedListItem(true, md.paragraph(md.text('done'))),
      ),
    );

    const actual = parseBlocks(ast, options);

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
      notion.table(
        [
          notion.tableRow([
            [notion.richText('a')],
            [notion.richText('b')],
            [notion.richText('c')],
            [notion.richText('d')],
          ]),
        ],
        4,
      ),
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
        md.link('https://example.com', text('d')),
      ),
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

  it('should parse basic GFM alert', () => {
    const ast = md.root(
      md.blockquote(
        md.paragraph(md.text('[!NOTE]')),
        md.paragraph(md.text('Important information')),
      ),
    );

    const actual = parseBlocks(ast, options);

    const expected = [
      notion.callout([notion.richText('Note')], '📘', 'blue_background', [
        notion.paragraph([notion.richText('Important information')]),
      ]),
    ];

    expect(actual).toStrictEqual(expected);
  });

  it('should parse GFM alert with formatted content', () => {
    const ast = md.root(
      md.blockquote(
        md.paragraph(md.text('[!TIP]')),
        md.paragraph(md.text('This is a tip with '), md.inlineCode('code')),
      ),
    );

    const actual = parseBlocks(ast, options);

    const expected = [
      notion.callout([notion.richText('Tip')], '💡', 'green_background', [
        notion.paragraph([
          notion.richText('This is a tip with '),
          notion.richText('code', {annotations: {code: true}}),
        ]),
      ]),
    ];

    expect(actual).toStrictEqual(expected);
  });

  it('should parse GFM alert with multiple paragraphs and lists', () => {
    const ast = md.root(
      md.blockquote(
        md.paragraph(md.text('[!IMPORTANT]')),
        md.paragraph(
          md.strong(md.text('Note:')),
          md.text(' Important '),
          md.emphasis(md.text('information')),
        ),
        md.paragraph(md.text('Additional details')),
        md.unorderedList(
          md.listItem(md.paragraph(md.text('Work in progress'))),
        ),
      ),
    );

    const actual = parseBlocks(ast, options);

    const expected = [
      notion.callout(
        [notion.richText('Important')],
        '☝️',
        'purple_background',
        [
          notion.paragraph([
            notion.richText('Note:', {annotations: {bold: true}}),
            notion.richText(' Important '),
            notion.richText('information', {annotations: {italic: true}}),
          ]),
          notion.paragraph([notion.richText('Additional details')]),
          notion.bulletedListItem([notion.richText('Work in progress')], []),
        ],
      ),
    ];

    expect(actual).toStrictEqual(expected);
  });
});
