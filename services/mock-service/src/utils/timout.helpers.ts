import { setTimeout } from 'node:timers/promises';

export async function timeoutQueue(ms: number): Promise<void> {
  const randomString = Math.random().toString(36).substring(2, 15);
  global.queueCallbacks[randomString] = 'timout'
  await setTimeout(ms);
  if (global.queueCallbacks[randomString] === 'timout') {
    delete global.queueCallbacks[randomString];
    return
  } else {
    throw new Error('Timeout');
  }
}
