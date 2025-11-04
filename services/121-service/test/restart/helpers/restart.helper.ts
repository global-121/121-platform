import * as request from 'supertest';

import { env } from '@121-service/src/env';
import { getServer } from '@121-service/test/helpers/utility.helper';

export async function kill121Service(): Promise<request.Response> {
  return getServer().post('/test/kill-service').send({
    secret: env.RESET_SECRET,
  });
}

export async function isServiceUp(): Promise<boolean> {
  return getServer()
    .get('/health/health')
    .then((response) => response.status === 200)
    .catch(() => false);
}
