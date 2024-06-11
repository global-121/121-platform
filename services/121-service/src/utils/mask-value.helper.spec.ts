import { maskValueStart } from '@121-service/src/utils/mask-value.helper';

describe('maskValueStart', () => {
  it('should mask the value by replacing all characters except the FIRST N characters with "*"', () => {
    // Arrange
    const tests = [
      {
        value: '1234567890',
        length: 4,
        expected: '1234******',
      },
      {
        value: 'secret',
        length: 8,
        expected: 'secret',
      },
      {
        value: 'confidential',
        length: 0,
        expected: '************',
      },
      {
        value: 'test',
        length: -3,
        expected: '****',
      },
    ];

    tests.forEach((testCase) => {
      // Act
      const result = maskValueStart(testCase.value, testCase.length);

      // Assert
      expect(result).toBe(testCase.expected);
    });
  });

  it('should mask the full value when no `length` is provided', () => {
    // Arrange
    const tests = [
      {
        value: '1234567890',
        expected: '**********',
      },
      {
        value: 'abc',
        expected: '***',
      },
    ];

    tests.forEach((testCase) => {
      // Act
      const result = maskValueStart(testCase.value);

      // Assert
      expect(result).toBe(testCase.expected);
      expect(result.length).toBe(testCase.value.length);
    });
  });

  it('should return an empty string when no `value` is provided', () => {
    // Arrange
    const testCase = {
      value: '',
      expected: '',
    };

    // Act
    const result = maskValueStart(testCase.value);

    // Assert
    expect(result).toBe(testCase.expected);
  });
});
