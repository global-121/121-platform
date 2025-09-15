import { AssertIso8601Pipe } from '@121-service/src/pipes/assert-iso8601.pipe';

describe('AssertIso8601Pipe', () => {
  describe('value is optional', () => {
    const pipe = new AssertIso8601Pipe({
      optional: true,
    });
    it('should not fail if value missing', async () => {
      const input = undefined;
      const result = await pipe.transform(input);
      expect(result).toBeUndefined();
    });

    it('should return original string if valid', async () => {
      const input = '2020-12-25';
      const result = await pipe.transform(input);
      expect(result).toBe(input);
    });
  });

  describe('value is non-optional', () => {
    const pipe = new AssertIso8601Pipe({ optional: false });

    it('should throw for no value', () => {
      const input = undefined;
      expect(() => pipe.transform(input)).toThrow(
        'Validation failed (date string expected)',
      );
    });

    it.concurrent.each([
      'not-a-date',
      'not-a-date',
      '25-12-20',
      '2020-13-01', // invalid month
    ])('should throw for "%s"', (input) => {
      expect(() => pipe.transform(input)).toThrow(
        'Validation failed (ISO 8601 date string is expected)',
      );
    });

    it('should return original string if valid', async () => {
      const input = '2020-12-25';
      const result = await pipe.transform(input);
      expect(result).toBe(input);
    });
  });
});
