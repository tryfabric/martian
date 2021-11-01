import {markdownToBlocks, markdownToRichText} from '../src';
import * as notion from '../src/notion';
import fs from 'fs';

describe('markdown converter', () => {
  it('should convert markdown to blocks', () => {
    const text = `
hello _world_ 
*** 
## heading2
* [x] todo
`;
    const actual = markdownToBlocks(text);

    const expected = [
      notion.paragraph([
        notion.richText('hello '),
        notion.richText('world', {annotations: {italic: true}}),
      ]),
      notion.headingTwo([notion.richText('heading2')]),
      notion.toDo(true, [notion.richText('todo')]),
    ];

    expect(expected).toStrictEqual(actual);
  });

  it('should convert markdown to blocks - deal with code', () => {
    const text = `
## Code
\`\`\` javascript
const hello = "hello";
\`\`\`
`;
    const actual = markdownToBlocks(text);

    const expected = [
      notion.headingTwo([notion.richText('Code')]),
      notion.code([notion.richText('const hello = "hello";')]),
    ];

    expect(expected).toStrictEqual(actual);
  });

  it('should convert markdown to blocks - deal with complex items', () => {
    const text = fs.readFileSync('test/fixtures/complex-items.md').toString();
    const actual = markdownToBlocks(text);

    const expected = [
      notion.headingOne([notion.richText('Images')]),
      notion.paragraph([notion.richText('This is a paragraph!')]),
      notion.blockquote([notion.richText('Quote')]),
      notion.paragraph([notion.richText('Paragraph')]),
      notion.image('https://url.com/image.jpg'),
      notion.table_of_contents(),
    ];

    expect(expected).toStrictEqual(actual);
  });

  it('should convert markdown to blocks - break up large elements', () => {
    const text = fs.readFileSync('test/fixtures/large-item.md').toString();
    const actual = markdownToBlocks(text);

    const paragraph = actual[1].paragraph as notion.RichText;
    const textArray = paragraph.text as Array<object>;

    expect(textArray.length).toStrictEqual(9);
  });

  it('should convert markdown to blocks - deal with lists', () => {
    const text = fs.readFileSync('test/fixtures/list.md').toString();
    const actual = markdownToBlocks(text);

    const expected = [
      notion.headingOne([notion.richText('List')]),
      notion.bulletedListItem(
        [notion.richText('Item 1')],
        [notion.bulletedListItem([notion.richText('Sub Item 1')])]
      ),
      notion.bulletedListItem([notion.richText('Item 2')]),
    ];

    expect(expected).toStrictEqual(actual);
  });

  it('should convert markdown to rich text', () => {
    const text = 'hello [_url_](https://example.com)';
    const actual = markdownToRichText(text);

    const expected = [
      notion.richText('hello '),
      notion.richText('url', {
        annotations: {italic: true},
        url: 'https://example.com',
      }),
    ];

    expect(expected).toStrictEqual(actual);
  });
});
