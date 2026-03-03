import * as request from 'supertest';

import { CreateProgramApprovalThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/create-program-approval-threshold.dto';
import { getServer } from '@121-service/test/helpers/utility.helper';

export async function putProgramApprovalThresholds(
  programId: number,
  thresholds: CreateProgramApprovalThresholdDto[],
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .put(`/programs/${programId}/approval-thresholds`)
    .set('Cookie', [accessToken])
    .send(thresholds);
}

export async function getProgramApprovalThresholds(
  programId: number,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .get(`/programs/${programId}/approval-thresholds`)
    .set('Cookie', [accessToken]);
}
