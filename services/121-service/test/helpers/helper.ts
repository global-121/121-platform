import crypto from 'crypto';
import * as request from 'supertest';
import { DEBUG } from '../../src/config';

export function getHostname(): string {
  return 'http://localhost:3000/api';
}

export function getServer(): request.SuperAgentTest {
  return request.agent(getHostname());
}

export function getIsDebug(): boolean {
  return DEBUG;
}

export async function resetDB(): Promise<void> {
  const server = getServer();
  const resetBody = {
    secret: process.env.RESET_SECRET,
  };
  await server
    .post('/scripts/reset')
    .query({ script: 'nlrc-multiple' })
    .send(resetBody);
}

export async function login(): Promise<request.Response> {
  const body = {
    username: process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    password: process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  };
  const server = getServer();
  return await server.post(`/user/login`).send(body);
}

export async function publishProgram(programId: number): Promise<void> {
  const server = getServer();
  await server
    .post(`/programs/${programId}/change-phase`)
    .send({ newPhase: 'registrationValidation' });
}

export async function importRegistrations(
  programId: number,
  registrations: object[],
  access_token: string,
): Promise<request.Response> {
  const server = getServer();
  return await server
    .post(`/programs/${programId}/registrations/import-registrations-cypress`)
    .set('Cookie', [access_token])
    .send(registrations);
}

export async function deleteRegistrations(
  programId: number,
  registrationReferenceIds: { referenceIds: string[] },
) {
  // /api/programs/{programId}/registrations/delete
  const server = getServer();
  await server
    .post(`/programs/${programId}/registrations/delete`)
    .send(registrationReferenceIds);
}

export function createEspoSignature(
  payload: any,
  secret: string,
  webhookId: string,
): string {
  const stringifiedBody = JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', secret).update(stringifiedBody);
  const hmacString = hmac.digest().toString('binary');
  const concatString = webhookId + ':' + hmacString;
  const base64encodedString = encodeBase64(concatString);

  return base64encodedString;
}

export function getRegistration(
  referenceId: string,
): Promise<request.Response> {
  const server = getServer();
  return server.get(`/registrations/get/${referenceId}`);
}

function encodeBase64(data): string {
  return Buffer.from(data, 'binary').toString('base64');
}
