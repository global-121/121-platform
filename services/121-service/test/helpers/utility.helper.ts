import * as request from 'supertest';
import { DebugScope } from '../../src/scripts/enum/debug-scope.enum';
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

export async function getAccessTokenScoped(
  defaultScope: DebugScope,
): Promise<string> {
  return await getAccessToken(
    `${defaultScope}@example.org`,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
}

export async function getAccessTokenCvaManager(): Promise<string> {
  return await getAccessToken(
    process.env.USERCONFIG_121_SERVICE_EMAIL_CVA_MANAGER,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_CVA_MANAGER,
  );
}

export async function updatePermissionsOfRole(
  userRoleId,
  roleToUpdate,
): Promise<void> {
  const accessToken = await getAccessToken();
  await getServer()
    .put(`/roles/${userRoleId}`)
    .set('Cookie', [accessToken])
    .send(roleToUpdate);
}
