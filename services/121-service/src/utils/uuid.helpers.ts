import { v4 as uuid, v5 as uuidv5 } from 'uuid';

const UUID_NAMESPACE = process.env.UUID_NAMESPACE || uuid();

/**
 * Generate a UUID v5 based on a seed.
 * @param seed The seed to generate the UUID.
 * @returns The generated UUID.
 */
export function generateUUIDFromSeed(seed: string): string {
  return uuidv5(seed, UUID_NAMESPACE);
}
