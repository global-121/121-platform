import {
  getValueOrEmpty,
  getValueOrFallback,
  getValueOrUnknown,
} from './get-value-helpers';

describe('GetValue-Helpers', () => {
  describe('getValueOrEmpty()', () => {
    it('should return fallback-value "-" for undefined input', () => {
      const input = undefined;

      const output = getValueOrEmpty(input);

      expect(output).toBe('-');
    });

    it('should return fallback-value "-" for undefined input, NOT using the provided function', () => {
      const transformFunction = jasmine.createSpy();
      const input = undefined;

      const output = getValueOrEmpty(input, transformFunction);

      expect(output).toBe('-');
      expect(transformFunction).not.toHaveBeenCalled();
    });

    it('should return the value for valid inputs', () => {
      const input = [null, 0, -1, 1, 'a', 'test', 'undefined'];

      input.forEach((item, index) => {
        const output = getValueOrEmpty(item);

        expect(output).toBe(input[index]);
      });
    });

    it('should return the transformed value using the provided function', () => {
      const returnValue = 'TEST';
      const transformFunction = jasmine
        .createSpy()
        .and.returnValue(returnValue);

      const input = ['test', 123, 0, ''];

      input.forEach((item) => {
        const output = getValueOrEmpty(item, transformFunction);

        expect(output).toBe(returnValue);
        expect(transformFunction).toHaveBeenCalled();
      });
    });
  });

  describe('getValueOrUnknown()', () => {
    it('should return fallback-value "?" for undefined input', () => {
      const input = undefined;

      const output = getValueOrUnknown(input);

      expect(output).toBe('?');
    });

    it('should return fallback-value "?" for undefined input, NOT using the provided function', () => {
      const transformFunction = jasmine.createSpy();
      const input = undefined;

      const output = getValueOrUnknown(input, transformFunction);

      expect(output).toBe('?');
      expect(transformFunction).not.toHaveBeenCalled();
    });

    it('should return the value for valid inputs', () => {
      const input = [null, 0, -1, 1, 'a', 'test', 'undefined'];

      input.forEach((item, index) => {
        const output = getValueOrUnknown(item);

        expect(output).toBe(input[index]);
      });
    });

    it('should return the transformed value using the provided function', () => {
      const returnValue = 'TEST';
      const transformFunction = jasmine
        .createSpy()
        .and.returnValue(returnValue);

      const input = ['test', 123, 0, '', null];

      input.forEach((item) => {
        const output = getValueOrUnknown(item, transformFunction);

        expect(output).toBe(returnValue);
        expect(transformFunction).toHaveBeenCalled();
      });
    });
  });

  describe('getValueOrFallback()', () => {
    it('should return the provided fallback-value for undefined input', () => {
      const input = undefined;
      const fallbackValue = '*';

      const output = getValueOrFallback(fallbackValue, input);

      expect(output).toBe(fallbackValue);
    });

    it('should return the provided fallback-value for undefined input, NOT using the provided function', () => {
      const transformFunction = jasmine.createSpy();
      const fallbackValue = '*';
      const input = undefined;

      const output = getValueOrFallback(
        fallbackValue,
        input,
        transformFunction,
      );

      expect(output).toBe(fallbackValue);
      expect(transformFunction).not.toHaveBeenCalled();
    });

    it('should return the value for valid inputs', () => {
      const fallbackValue = '*';
      const input = [null, 0, -1, 1, 'a', 'test', 'undefined'];

      input.forEach((item, index) => {
        const output = getValueOrFallback(fallbackValue, item);

        expect(output).toBe(input[index]);
      });
    });

    it('should return the transformed value using the provided function', () => {
      const returnValue = 'TEST';
      const transformFunction = jasmine
        .createSpy()
        .and.returnValue(returnValue);

      const fallbackValue = '*';
      const input = ['test', 123, 0, '', null];

      input.forEach((item) => {
        const output = getValueOrFallback(
          fallbackValue,
          item,
          transformFunction,
        );

        expect(output).toBe(returnValue);
        expect(transformFunction).toHaveBeenCalled();
      });
    });
  });
});
