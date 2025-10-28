import { sanitizeEmailInput } from '@121-service/src/emails/helpers/sanitize-email-input';

describe('sanitizeEmailInput', () => {
  it('removes html tags and decodes entities from displayName', () => {
    const input = { displayName: 'Hello <b>World</b> &amp; "You"' };

    const result = sanitizeEmailInput(input);

    expect(result.displayName).toBe('Hello World & "You"');
  });

  it('preserves other properties and returns new object', () => {
    const input = { displayName: '<i>Name</i>', extra: 'value' } as const;

    const result = sanitizeEmailInput(input);

    expect(result).not.toBe(input);
    expect(result.extra).toBe('value');
    expect(result.displayName).toBe('Name');
  });
});
