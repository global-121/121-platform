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
