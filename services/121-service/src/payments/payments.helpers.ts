import fs from 'fs';
import * as https from 'https';
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

/**
 * Create an HTTPS agent with a certificate.
 * @param certificatePath The path to the certificate.
 * @param password The passphrase for the certificate.
 * @returns The HTTPS agent.
 */
export function createHttpsAgentWithCertificate(
  certificatePath: string,
  password: string,
): https.Agent {
  return new https.Agent({
    pfx: fs.readFileSync(certificatePath),
    passphrase: password,
  });
}
