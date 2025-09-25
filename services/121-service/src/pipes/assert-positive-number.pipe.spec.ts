import { AssertPositiveNumberPipe } from '@121-service/src/pipes/assert-positive-number.pipe';

describe('ParsePositiveNumberPipe', () => {
  describe('value is optional', () => {
    it('should not fail if value missing', () => {
      const pipe = new AssertPositiveNumberPipe({
        optional: true,
      });
      // Arrange
      const input = undefined;
      // Act
      const result = pipe.transform(input);
      // Assert
      expect(result).toBeUndefined();
    });
  });
  describe('value is non-optional', () => {
    const pipe = new AssertPositiveNumberPipe({});
    it('should throw for no value', () => {
      const input = undefined;
      expect(() => pipe.transform(input)).toThrow(
        'Validation failed (numeric value is expected)',
      );
    });

    it('should throw for non-number', () => {
      // TypeScript does not correctly type check pipes, so we do in the pipe.
      // Also means we need to test this like this.
      const input = 'not-a-number' as unknown as number;
      expect(() => pipe.transform(input)).toThrow(
        'Validation failed (numeric value is expected)',
      );
    });

    it('should throw for non-positive number', () => {
      // Arrange
      const input = -121;
      // Act & Assert
      expect(() => pipe.transform(input)).toThrow(
        'Validation failed (value -121 is not a positive number)',
      );
    });

    it('should return number for positive number', () => {
      // Arrange
      const num = 3;
      // Act
      const result = pipe.transform(num);
      // Assert
      expect(result).toBe(num);
    });
  });
});
