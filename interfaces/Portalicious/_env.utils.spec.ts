import { shouldBeEnabled } from '_env.utils.mjs';

describe('Utils: shouldBeEnabled', () => {
  it('should return a boolean true for select ENV-variable values', () => {
    // Arrange
    const testValues = [
      '1',
      'enable',
      'Enable',
      'enabled',
      'Enabled',
      'on',
      'On',
      'true',
      'True',
      'TRUE',
      'y',
      'Y',
      'yep',
      'yes',
      'Yes',
      'YES',
    ];

    // Act
    testValues.forEach((value) => {
      const result = shouldBeEnabled(value);

      // Assert
      expect(result).toBe(true);
    });
  });

  it('should return a boolean false for other possible ENV-variable values', () => {
    // Arrange
    const testValues = [
      ' ',
      '!',
      '!true',
      '?',
      '',
      '[]',
      '0',
      'disable',
      'disabled',
      'false',
      'FALSE',
      'n',
      'no',
      'No',
      'nope',
      'null',
      'off',
      'random value',
      'undefined',
    ];

    // Act
    testValues.forEach((value) => {
      const result = shouldBeEnabled(value);

      // Assert
      expect(result).toBe(false);
    });
  });
});
