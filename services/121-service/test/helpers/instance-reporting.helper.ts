import * as request from 'supertest';

import { getServer } from '@121-service/test/helpers/utility.helper';

export async function pushInstanceReportingData(
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .post('/cronjobs/instance-reporting')
    .set('Cookie', [accessToken]);
}
