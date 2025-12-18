import * as request from 'supertest';

import { getServer } from '@121-service/test/helpers/utility.helper';

export async function getUserRoles(
  accessToken: string,
): Promise<request.Response> {
  return getServer().get('/roles').set('Cookie', [accessToken]).send();
}

export async function getAllUsers(
  accessToken: string,
): Promise<request.Response> {
  return getServer().get('/users').set('Cookie', [accessToken]).send();
}

export async function getAllUsersByProgramId(
  accessToken: string,
  programId: string,
): Promise<request.Response> {
  return getServer()
    .get(`/programs/${programId}/users`)
    .set('Cookie', [accessToken])
    .send();
}
