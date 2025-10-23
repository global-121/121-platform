import { stripHtmlTags } from '@121-service/src/utils/strip-html-tags.helper';

describe('stripHtmlTags', () => {
  it('should strip simple HTML tags', () => {
    const input = '<div><p>Hello <strong>world</strong>!</p></div>';
    const result = stripHtmlTags(input);
    expect(result).toBe('Hello world!');
  });

  it('should handle common HTML entities', () => {
    const input = 'Tom &amp; Jerry &lt;3 &quot;cartoons&quot;';
    const result = stripHtmlTags(input);
    expect(result).toBe('Tom & Jerry <3 "cartoons"');
  });

  it('should strip tags with attributes', () => {
    const input = '<a href="http://evil.com" onclick="hack()">Click me</a>';
    const result = stripHtmlTags(input);
    expect(result).toBe('Click me');
  });

  it('should handle mixed content with entities and tags', () => {
    const input = '<p>Name: &quot;John &amp; Jane&quot;</p>';
    const result = stripHtmlTags(input);
    expect(result).toBe('Name: "John & Jane"');
  });

  it('should handle string with no HTML', () => {
    const input = 'Just plain text';
    const result = stripHtmlTags(input);
    expect(result).toBe('Just plain text');
  });
});
