import crypto from 'crypto';
import * as request from 'supertest';
import { DEBUG } from '../../src/config';
import { SeedScript } from '../../src/scripts/scripts.controller';

export function getHostname(): string {
  return 'http://localhost:3000/api';
}

export function getServer(): request.SuperAgentTest {
  return request.agent(getHostname());
}

export function getIsDebug(): boolean {
  return DEBUG;
}

export async function resetDB(seedScript: SeedScript): Promise<void> {
  await getServer()
    .post('/scripts/reset')
    .query({
      script: seedScript,
    })
    .send({
      secret: process.env.RESET_SECRET,
    });
}

export async function loginAsAdmin(): Promise<request.Response> {
  return await getServer().post(`/user/login`).send({
    username: process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    password: process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  });
}

export async function getAccessToken(): Promise<string> {
  const login = await loginAsAdmin();
  const cookies = login.headers['set-cookie'][0];
  const accessToken = cookies
    .split(';')
    .find((cookie: string) => cookie.indexOf('access_token') !== -1);

  return accessToken;
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

function encodeBase64(data): string {
  return Buffer.from(data, 'binary').toString('base64');
}
