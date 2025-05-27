import { v5 as uuidv5 } from 'uuid';

import { env } from '@121-service/src/env';

export function generateUUIDFromSeed(seed: string): string {
  return uuidv5(seed, env.UUID_NAMESPACE);
}
