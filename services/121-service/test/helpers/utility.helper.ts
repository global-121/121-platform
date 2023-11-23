import * as request from 'supertest';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { CookieNames } from '../../src/shared/enum/cookie.enums';

export function getHostname(): string {
  return 'http://localhost:3000/api';
}

export function getServer(): request.SuperAgentTest {
  return request.agent(getHostname());
}

export function resetDB(seedScript: SeedScript): Promise<request.Response> {
  return getServer()
    .post('/scripts/reset')
    .query({
      script: seedScript,
      isApiTests: true,
    })
    .send({
      secret: process.env.RESET_SECRET,
    });
}

export function loginAsAdmin(): Promise<request.Response> {
  return getServer().post(`/users/login`).send({
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

export function loginAsProgramManager(): Promise<request.Response> {
  return getServer().post(`/users/login`).send({
    username: process.env.USERCONFIG_121_SERVICE_EMAIL_USER_RUN_PROGRAM,
    password: process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_RUN_PROGRAM,
  });
}

export async function getAccessTokenProgramManager(): Promise<string> {
  const login = await loginAsProgramManager();
  const cookies = login.get('Set-Cookie');
  const accessToken = cookies
    .find((cookie: string) => cookie.startsWith(CookieNames.general))
    .split(';')[0];

  return accessToken;
}
