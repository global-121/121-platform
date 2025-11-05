import * as request from 'supertest';

import { env } from '@121-service/src/env';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import { getServer } from '@121-service/test/helpers/utility.helper';

export async function kill121Service(): Promise<request.Response> {
  return getServer().post('/test/kill-service').send({
    secret: env.RESET_SECRET,
  });
}

export async function waitForServiceToBeUp(): Promise<void> {
  let serviceUp = false;
  console.log('Waiting for 121 service to be up...');
  while (!serviceUp) {
    serviceUp = await isServiceUp();
    await waitFor(1_000);
  }
  return serviceUp;
}
export async function isServiceUp(): Promise<boolean> {
  return getServer()
    .get('/health/health')
    .then((response) => response.status === 200)
    .catch(() => false);
}
