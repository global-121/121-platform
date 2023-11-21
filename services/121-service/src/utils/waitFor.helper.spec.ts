import { waitFor, waitForRandomDelay } from './waitFor.helper';

describe('waitFor helpers', () => {
  it('waitFor - should wait for the specified time', async () => {
    // Arrange
    const testTime = 123;
    const start = Date.now();

    // Act
    const testPromise = waitFor(testTime);

    await testPromise;

    // Assert
    const end = Date.now();
    const elapsed = end - start;
    expect(elapsed).toBeGreaterThanOrEqual(testTime);
    expect(elapsed).toBeLessThan(testTime + 3); // With a few ms margin
  });

  it('waitForRandomDelay - should wait for a random delay between "min" and "max" milliseconds', async () => {
    // Arrange
    const testMin = 100;
    const testMax = 300;
    const start = Date.now();

    // Act
    await waitForRandomDelay(testMin, testMax);

    // Assert
    const end = Date.now();
    const elapsed = end - start;
    expect(elapsed).toBeGreaterThanOrEqual(testMin);
    expect(elapsed).toBeLessThan(testMax + 3); // With a few ms margin
  });
});
