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
    expect(elapsed).toBeLessThanOrEqual(testTime * 1.1);
  });

  it('waitForRandomDelay - should wait for a random delay between "100" and "300" milliseconds', async () => {
    // Arrange
    const start = Date.now();

    // Act
    await waitForRandomDelay(100, 300);

    // Assert
    const end = Date.now();
    const elapsed = end - start;
    expect(elapsed).toBeGreaterThanOrEqual(100);
    expect(elapsed).toBeLessThanOrEqual(300);
  });

  it('waitForRandomDelay - should wait for a random delay between "50" and "100" milliseconds', async () => {
    // Arrange
    const start = Date.now();

    // Act
    await waitForRandomDelay(50, 100);

    // Assert
    const end = Date.now();
    const delay = end - start;
    expect(delay).toBeGreaterThanOrEqual(50);
    expect(delay).toBeLessThanOrEqual(100);
  });
});
