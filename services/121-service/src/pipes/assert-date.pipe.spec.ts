import { AssertDatePipe } from '@121-service/src/pipes/assert-date.pipe';

describe('AssertDatePipe', () => {
  describe('should receive valid options', () => {
    it('should fail when creating pipe without options', () => {
      // Act
      expect(() => new AssertDatePipe({})).toThrow(
        'To use this pipe you must pass an options object with at least one attribute that is not the "optional" option.',
      );
    });
    it('should fail when creating pipe with only optional option', () => {
      // Act
      expect(() => new AssertDatePipe({ optional: true })).toThrow(
        'To use this pipe you must pass an options object with at least one attribute that is not the "optional" option.',
      );
    });
  });

  describe('value is optional', () => {
    it('should not fail if value missing', async () => {
      const pipe = new AssertDatePipe({
        optional: true,
        allowFuture: true,
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
    const pipe = new AssertDatePipe({ optional: false, allowFuture: true });

    it('should throw for no value', () => {
      const input = undefined;
      expect(() => pipe.transform(input)).toThrow(
        'Validation failed (date value is expected)',
      );
    });

    it('should throw for non-date', () => {
      const input = 'not-a-date' as unknown as Date;
      expect(() => pipe.transform(input)).toThrow(
        'Validation failed (date value is expected)',
      );
    });
  });

  describe('dates in the future are disallowed', () => {
    const pipe = new AssertDatePipe({ optional: false, allowFuture: false });
    const millisecondsInOneDay = 24 * 60 * 60 * 1000;
    it('should throw for date in future', () => {
      // Arrange
      const input = new Date(Date.now() + 2 * millisecondsInOneDay);
      // Act & Assert
      expect(() => pipe.transform(input)).toThrow(
        'Validation failed (future dates are not allowed)',
      );
    });

    it('should not throw for current date', () => {
      // Arrange
      const input = new Date(Date.now());
      // Act
      const result = pipe.transform(input);

      // Assert
      expect(result).toBe(input);
    });

    it('should not throw on past date', () => {
      // Arrange
      const input = new Date(Date.now() - 2 * millisecondsInOneDay);
      // Act & Assert
      expect(() => {
        pipe.transform(input);
      }).not.toThrow();
    });
  });
});
