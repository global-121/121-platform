import { setTimeout } from 'node:timers/promises';

export async function createCancelableTimeout(ms: number): Promise<void> {
  const randomString = Math.random().toString(36).substring(2, 15);
  global.queueCallbacks[randomString] = 'timeout';
  await setTimeout(ms);
  if (global.queueCallbacks[randomString] === 'timeout') {
    delete global.queueCallbacks[randomString];
    return;
  } else {
    throw new Error(`This queue has been cancelled. {${randomString}`);
  }
}
