import { isSameStatus } from '@121-service/src/utils/comparison.helper';

describe('comparison.helper', () => {
  describe('isSameStatus', () => {
    it('should return the correct outcome for all values', () => {
      // // Arrange
      const testCases = [
        { a: 200, b: 200, is: true },
        { a: '404', b: 404, is: true },
        { a: '500', b: '500', is: true },
        { a: 301, b: '301', is: true },
        { a: '403', b: 404, is: false },
        { a: 301, b: 302, is: false },
        { a: '500', b: '501', is: false },
        // Edge-cases:
        { a: undefined, b: 'ok', is: false },
        { a: 'ok', b: undefined, is: false },
        { a: undefined, b: undefined, is: true },
        { a: 'undefined', b: undefined, is: true },
        { a: undefined, b: 'undefined', is: true },
        { a: 'undefined', b: 'undefined', is: true },
        { a: '', b: '', is: true },
        { a: 0, b: 'null', is: false },
        // Weird edge-cases:
        {
          a: '1000000000000000000000',
          b: '1000000000000000000000',
          is: true,
        },
        { a: 1000000000000000000000, b: '1e+21', is: true },
        {
          a: '1000000000000000000000',
          b: 1000000000000000000000,
          is: false,
        },
        {
          a: 1000000000000000000000,
          b: 1_000_000_000_000_000_000_000,
          is: true,
        },
      ];

      testCases.forEach((testCase) => {
        // Act
        const result = isSameStatus(testCase.a, testCase.b);

        // Assert
        expect(result).toBe(testCase.is);
      });
    });
  });
});
