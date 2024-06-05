import { splitArrayIntoChunks } from '@121-service/src/utils/chunk.helper';

describe('splitArrayIntoChunks', () => {
  it('should correctly split an array into specified chunk sizes', () => {
    // Arrange
    const tests = [
      {
        in: { array: [1, 2, 3, 4, 5], chunkSize: 2 },
        out: [[1, 2], [3, 4], [5]],
      },
      {
        in: { array: [], chunkSize: 3 },
        out: [],
      },
      {
        in: { array: [1, 2, 3], chunkSize: 4 },
        out: [[1, 2, 3]],
      },
      {
        in: { array: [1], chunkSize: 1 },
        out: [[1]],
      },
    ];

    tests.forEach(({ in: { array, chunkSize }, out }) => {
      // Act
      const result = splitArrayIntoChunks(array, chunkSize);

      // Assert
      expect(result).toEqual(out);
    });
  });

  // Optionally, if your function should validate input and throw for invalid cases
  it('should handle or throw for invalid inputs', () => {
    // Arrange
    const invalidInputs = [
      { array: null, chunkSize: 3 },
      { array: undefined, chunkSize: 2 },
      // Add more invalid cases as necessary
    ];

    invalidInputs.forEach(({ array, chunkSize }) => {
      // Assert
      expect(() => {
        // Act
        splitArrayIntoChunks(array as any, chunkSize);
      }).toThrow(); // Or to handle gracefully, depending on your function implementation
    });
  });
});
