import {markdownToBlocks, markdownToRichText} from '../src';
import * as notion from '../src/notion';
import fs from 'fs';
import {LIMITS} from '../src/notion';

describe('markdown converter', () => {
  describe('markdownToBlocks', () => {
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

    it('should deal with code', () => {
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

    it('should deal with complex items', () => {
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

    it('should break up large elements', () => {
      const text = fs.readFileSync('test/fixtures/large-item.md').toString();
      const actual = markdownToBlocks(text);

      const paragraph = actual[1].paragraph as unknown as notion.RichText;
      const textArray = paragraph.text as unknown as Array<object>;

      expect(textArray.length).toStrictEqual(9);
    });

    it('should deal with lists', () => {
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

    it('should skip tables if unsupported = false', () => {
      const text = fs.readFileSync('test/fixtures/table.md').toString();
      const actual = markdownToBlocks(text, {
        allowUnsupported: false,
      });
      const expected = [notion.headingOne([notion.richText('Table')])];
      expect(expected).toStrictEqual(actual);
    });

    it('should include tables if unsupported = true', () => {
      const text = fs.readFileSync('test/fixtures/table.md').toString();
      const actual = markdownToBlocks(text, {allowUnsupported: true});
      const expected = [
        notion.headingOne([notion.richText('Table')]),
        notion.table([
          notion.tableRow([
            notion.tableCell([notion.richText('First Header')]),
            notion.tableCell([notion.richText('Second Header')]),
          ]),
          notion.tableRow([
            notion.tableCell([notion.richText('Content Cell')]),
            notion.tableCell([notion.richText('Content Cell')]),
          ]),
          notion.tableRow([
            notion.tableCell([notion.richText('Content Cell')]),
            notion.tableCell([notion.richText('Content Cell')]),
          ]),
        ]),
      ];

      expect(expected).toStrictEqual(actual);
    });

    it('should convert markdown to blocks - deal with images - strict mode', () => {
      const text = fs.readFileSync('test/fixtures/images.md').toString();
      const actual = markdownToBlocks(text, {strictImageUrls: true});

      const expected = [
        notion.headingOne([notion.richText('Images')]),
        notion.paragraph([
          notion.richText('This is an image in a paragraph '),
          notion.richText(', which isnt supported in Notion.'),
        ]),
        notion.image('https://image.com/url.jpg'),
        notion.image('https://image.com/paragraph.jpg'),
        notion.paragraph([notion.richText('https://image.com/blah')]),
      ];

      expect(expected).toStrictEqual(actual);
    });

    it('should convert markdown to blocks - deal with images - not strict mode', () => {
      const text = fs.readFileSync('test/fixtures/images.md').toString();
      const actual = markdownToBlocks(text, {strictImageUrls: false});

      const expected = [
        notion.headingOne([notion.richText('Images')]),
        notion.paragraph([
          notion.richText('This is an image in a paragraph '),
          notion.richText(', which isnt supported in Notion.'),
        ]),
        notion.image('https://image.com/url.jpg'),
        notion.image('https://image.com/paragraph.jpg'),
        notion.image('https://image.com/blah'),
      ];

      expect(expected).toStrictEqual(actual);
    });
  });

  describe('markdownToRichText', () => {
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

    it('should convert markdown with multiple newlines to rich text', () => {
      const text = 'hello\n\n[url](http://google.com)';
      const actual = markdownToRichText(text);

      const expected = [
        notion.richText('hello'),
        notion.richText('url', {
          url: 'http://google.com',
        }),
      ];

      expect(expected).toStrictEqual(actual);
    });

    it('should truncate items when options.notionLimits.truncate = true', () => {
      const text = Array(LIMITS.RICH_TEXT_ARRAYS + 10)
        .fill('a *a* ')
        .join('');

      const actual = {
        default: markdownToRichText(text),
        explicit: markdownToRichText(text, {notionLimits: {truncate: true}}),
      };

      expect(actual.default.length).toBe(LIMITS.RICH_TEXT_ARRAYS);
      expect(actual.explicit.length).toBe(LIMITS.RICH_TEXT_ARRAYS);
    });

    it('should not truncate items when options.notionLimits.truncate = false', () => {
      const text = Array(LIMITS.RICH_TEXT_ARRAYS + 10)
        .fill('a *a* ')
        .join('');

      const actual = markdownToRichText(text, {
        notionLimits: {truncate: false},
      });

      expect(actual.length).toBeGreaterThan(LIMITS.RICH_TEXT_ARRAYS);
    });

    it('should call the callback when options.notionLimits.onError is defined', () => {
      const text = Array(LIMITS.RICH_TEXT_ARRAYS + 10)
        .fill('a *a* ')
        .join('');
      const spy = jest.fn();

      markdownToRichText(text, {
        notionLimits: {onError: spy},
      });

      expect(spy).toBeCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
