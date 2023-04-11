import * as request from 'supertest';
import { DEBUG } from '../../src/config';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { CookieNames } from '../../src/shared/enum/cookie.enums';

export function getHostname(): string {
  return 'http://localhost:3000/api';
}

export function getServer(): request.SuperAgentTest {
  return request.agent(getHostname());
}

export const itSkipIfDebug = DEBUG ? it.skip : it;

export function resetDB(seedScript: SeedScript): Promise<request.Response> {
  return getServer()
    .post('/scripts/reset')
    .query({
      script: seedScript,
    })
    .send({
      secret: process.env.RESET_SECRET,
    });
}

export function loginAsAdmin(): Promise<request.Response> {
  return getServer().post(`/user/login`).send({
    username: process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    password: process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  });
}

export async function getAccessToken(): Promise<string> {
  const login = await loginAsAdmin();
  const cookies = login.get('Set-Cookie');
  const accessToken = cookies
    .find((cookie: string) => cookie.startsWith(CookieNames.general))
    .split(';')[0];

  return accessToken;
}

export async function waitFor(timeInMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeInMs));
}
