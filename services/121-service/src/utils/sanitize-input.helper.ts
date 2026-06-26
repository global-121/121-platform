import sanitizeHtml from 'sanitize-html';

/**
 * Turn user-input into plain text, by stripping any undesirable elements (such as HTML tags) and escapes special characters.
 *
 * ⚠️ Always use this on data from ___any___ untrusted source, such as user input, before using it in any context where HTML is interpreted (e.g., email-content, rendering in a web page).
 */
export function sanitizeInput(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  });
}
