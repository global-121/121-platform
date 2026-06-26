import { sanitizeInput } from '@121-service/src/utils/sanitize-input.helper';

describe('Sanitize user-input to plain text', () => {
  it('should strip simple HTML tags', () => {
    const input = '<div><p>Hello <strong>world</strong>!</p></div>';
    const result = sanitizeInput(input);
    expect(result).toBe('Hello world!');
  });

  it('should remove script tags', () => {
    const input = 'Tom & Jerry <3 <script>alert("cartoons");</script>';
    const result = sanitizeInput(input);
    expect(result).toBe('Tom &amp; Jerry &lt;3 ');
  });

  it('should strip tags with attributes', () => {
    const input = '<a href="http://evil.com" onclick="hack()">Click me</a>';
    const result = sanitizeInput(input);
    expect(result).toBe('Click me');
  });

  it('should handle mixed content with entities and tags', () => {
    const input = '<p>Name: John & "Jane"</p>';
    const result = sanitizeInput(input);
    expect(result).toBe('Name: John &amp; "Jane"');
  });

  it('should handle string with no HTML', () => {
    const input = 'Just plain text';
    const result = sanitizeInput(input);
    expect(result).toBe('Just plain text');
  });
});
