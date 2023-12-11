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

export function loginApi(
  username: string,
  password: string,
): Promise<request.Response> {
  return getServer().post(`/users/login`).send({
    username,
    password,
  });
}

export async function getAccessToken(
  username = process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
  password = process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
): Promise<string> {
  const login = await loginApi(username, password);
  const cookies = login.get('Set-Cookie');
  const accessToken = cookies
    .find((cookie: string) => cookie.startsWith(CookieNames.general))
    .split(';')[0];

  return accessToken;
}

export async function getAccessTokenProgramManager(): Promise<string> {
  return await getAccessToken(
    process.env.USERCONFIG_121_SERVICE_EMAIL_USER_RUN_PROGRAM,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_RUN_PROGRAM,
  );
}
