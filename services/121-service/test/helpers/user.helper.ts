import * as request from 'supertest';

import { getServer } from '@121-service/test/helpers/utility.helper';

export async function getUserRoles(
  accessToken: string,
): Promise<request.Response> {
  return getServer().get('/roles').set('Cookie', [accessToken]).send();
}
