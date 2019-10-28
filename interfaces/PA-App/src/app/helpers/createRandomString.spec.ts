import { createRandomString } from './createRandomString';

describe('createRandomString()', () => {
  it('should output a string with the requested length', () => {
    const input = [0, 1, 2, 3, 10, 42, 100];

    input.forEach((item) => {
      const output = createRandomString(item);

      expect(output.length).toBe(item);
    });

  });

  it('should not contain invalid characters', () => {
    const invalidCharacters = ['@', '-', '_'];
    const output = createRandomString(100);

    invalidCharacters.forEach((invalidCharacter) => {
      expect(output).not.toContain(invalidCharacter);
    });
  });
});
