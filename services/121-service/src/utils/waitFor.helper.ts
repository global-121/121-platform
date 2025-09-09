import { setTimeout } from 'node:timers/promises';

import { getRandomInt } from '@121-service/src/utils/random-value.helper';

export async function waitFor(timeInMs: number): Promise<void> {
  return setTimeout(timeInMs);
}

export async function waitForRandomDelay(
  minTimeInMs: number,
  maxTimeInMs: number,
): Promise<void> {
  return await waitFor(getRandomInt(minTimeInMs, maxTimeInMs));
}
