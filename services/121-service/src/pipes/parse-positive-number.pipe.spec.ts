import { HttpException } from '@nestjs/common';

import { ParsePositiveNumberPipe } from '@121-service/src/pipes/parse-positive-number.pipe';

class CustomTestError extends HttpException {
  constructor() {
    super('This is a TestException', 418);
  }
}

describe('ParsePositiveNumberPipe', () => {
  describe('value is optional', () => {
    it('should not fail if value missing', async () => {
      const pipe = new ParsePositiveNumberPipe({
        optional: true,
      });
      // Arrange
      const input = undefined;
      // Act
      const result = await pipe.transform(input);
      // Assert
      expect(result).toBeUndefined();
    });
  });
  describe('value is non-optional', () => {
    const pipe = new ParsePositiveNumberPipe({});
    it('should throw for no value', async () => {
      const input = undefined;
      await expect(pipe.transform(input)).rejects.toThrow(
        'Validation failed (numeric value is expected)',
      );
    });

    it('should throw for non-number', async () => {
      // TypeScript does not correctly type check pipes, so we do in the pipe.
      // Also means we need to test this like this.
      const input = 'not-a-number' as unknown as number;
      await expect(pipe.transform(input)).rejects.toThrow(
        'Validation failed (numeric value is expected)',
      );
    });

    it('should throw for non-positive number', async () => {
      // Arrange
      const input = -121;
      // Act & Assert
      await expect(pipe.transform(input)).rejects.toThrow(
        'Validation failed (value -121 is not a positive number)',
      );
    });

    it('should return number for positive number', async () => {
      // Arrange
      const num = 3;
      // Act
      const result = await pipe.transform(num);
      // Assert
      expect(result).toBe(num);
    });
  });
});
