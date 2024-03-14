import * as request from 'supertest';
import { getServer } from './utility.helper';

export async function getCurrentUser(
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .get('/users/current')
    .set('Authorization', `Bearer ${accessToken}`);
}
