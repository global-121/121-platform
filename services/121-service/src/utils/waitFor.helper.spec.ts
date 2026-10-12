import { setTimeout } from 'node:timers/promises';

import { getRandomInt } from '@121-service/src/utils/random-value.helper';
import {
  waitFor,
  waitForRandomDelay,
} from '@121-service/src/utils/waitFor.helper';

jest.mock('node:timers/promises', () => ({
  setTimeout: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@121-service/src/utils/random-value.helper');

describe('waitFor helpers', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('waitFor - should wait for the specified time', async () => {
    // Arrange
    const testTime = 121;

    // Act
    await waitFor(testTime);

    // Assert
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenCalledWith(testTime);
  });

  it('waitForRandomDelay - should wait for the random value between "min" and "max"', async () => {
    // Arrange
    const testMin = 100;
    const testMax = 300;
    const randomValue = 121;
    jest.mocked(getRandomInt).mockReturnValue(randomValue);

    // Act
    await waitForRandomDelay(testMin, testMax);

    // Assert
    expect(getRandomInt).toHaveBeenCalledWith(testMin, testMax);
    expect(setTimeout).toHaveBeenCalledWith(randomValue);
  });
});
