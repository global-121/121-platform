import { parseMatomoConnectionString } from '_matomo.utils.mjs';

describe('Matomo-Util: parseMatomoConnectionString', () => {
  it('should return an empty object when input is false-y', () => {
    // Arrange
    const testCases = ['', ' ', 'undefined', 'null', null, undefined];

    // Act
    testCases.forEach((testCase) => {
      const result = parseMatomoConnectionString(testCase);
      // Assert
      expect(result).toEqual({
        api: '',
        id: '',
        sdk: '',
      });
    });
  });

  it('should return a partially filled object when input is incomplete', () => {
    // Arrange
    const testCases = [
      {
        input: ' ',
        expected: {
          api: '',
          id: '',
          sdk: '',
        },
      },
      {
        input: 'undefined',
        expected: {
          api: '',
          id: '',
          sdk: '',
        },
      },
      {
        input: 'id=42',
        expected: {
          api: '',
          id: '42',
          sdk: '',
        },
      },
      {
        input: 'id=42;api=https://example.net/api/',
        expected: {
          api: 'https://example.net/api/',
          id: '42',
          sdk: '',
        },
      },
    ];

    // Act
    testCases.forEach((testCase) => {
      const result = parseMatomoConnectionString(testCase.input);
      // Assert
      expect(result).toEqual(testCase.expected);
    });
  });

  it('should parse sloppy syntax into a correct object', () => {
    // Arrange
    const testValues = [
      'id=42;api=https://example.net/api/;sdk=https://cdn.example.net/sdk.js',
      ' id=42; api=https://example.net/api/; sdk=https://cdn.example.net/sdk.js ',
      ' id = 42; api = https://example.net/api/; sdk = https://cdn.example.net/sdk.js ',
    ];

    // Act
    testValues.forEach((value) => {
      const result = parseMatomoConnectionString(value);

      // Assert
      expect(result).toEqual({
        api: 'https://example.net/api/',
        id: '42',
        sdk: 'https://cdn.example.net/sdk.js',
      });
    });
  });
});
