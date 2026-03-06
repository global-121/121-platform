import * as request from 'supertest';

import { CreateKoboDto } from '@121-service/src/kobo/dtos/create-kobo.dto';
import {
  getMockServer,
  getServer,
} from '@121-service/test/helpers/utility.helper';

export async function postKoboToProgram({
  programId,
  body,
  accessToken,
  dryRun = false,
}: {
  programId: number;
  body: CreateKoboDto;
  accessToken: string;
  dryRun: boolean;
}): Promise<request.Response> {
  const queryParams = { dryRun };

  return await getServer()
    .post(`/programs/${programId}/kobo`)
    .set('Cookie', [accessToken])
    .query(queryParams)
    .send(body);
}

export async function getKoboFromProgram({
  programId,
  accessToken,
}: {
  programId: number;
  accessToken: string;
}): Promise<request.Response> {
  return await getServer()
    .get(`/programs/${programId}/kobo`)
    .set('Cookie', [accessToken]);
}

export async function triggerKoboSubmission({
  assetUid,
  submissionUuid,
}: {
  assetUid: string;
  submissionUuid: string;
}): Promise<request.Response> {
  return await getMockServer()
    .post(`/kobo/api/v2/assets/${assetUid}/trigger-submission`)
    .send({ submissionUuid });
}
