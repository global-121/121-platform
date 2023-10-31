import { setTimeout } from 'node:timers/promises';
import { getRandomInt } from './getRandomInt.helper';

export async function waitFor(timeInMs: number): Promise<void> {
  return setTimeout(timeInMs);
}

export async function waitForRandomDelay(): Promise<void> {
  return await waitFor(getRandomInt(100, 300));
}

export async function waitForRandomDelayShort(): Promise<void> {
  return await waitFor(getRandomInt(50, 100));
}
