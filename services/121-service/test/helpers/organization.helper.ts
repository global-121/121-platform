import * as request from 'supertest';

import { getServer } from '@121-service/test/helpers/utility.helper';

export async function getAllExchangeRates(
  accessToken: string,
): Promise<request.Response> {
  return await getServer().get(`/exchange-rates`).set('Cookie', [accessToken]);
}

export async function retrieveAndStoreAllExchangeRates(
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .put(`/cronjobs/exchange-rates`)
    .set('Cookie', [accessToken]);
}
