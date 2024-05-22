import { getRandomInt } from '@121-service/src/utils/getRandomValue.helper';

describe('getRandomValue', () => {
  it('should return a random integer between min and max (inclusive)', () => {
    // Arrange
    const min = 1;
    const max = 10;

    // Act
    const result = getRandomInt(min, max);

    // Assert
    expect(result).toBeGreaterThanOrEqual(min);
    expect(result).toBeLessThanOrEqual(max);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('should return min if min and max are the same', () => {
    // Arrange
    const min = 5;
    const max = 5;

    // Act
    const result = getRandomInt(min, max);

    // Assert
    expect(result).toBe(min);
  });

  it('should return NaN if min is greater than max', () => {
    // Arrange
    const min = 10;
    const max = 1;

    // Act
    const result = getRandomInt(min, max);

    // Assert
    expect(result).toBeNaN();
  });
});
