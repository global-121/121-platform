import * as request from 'supertest';

import { getServer } from '@121-service/test/helpers/utility.helper';

export async function replaceProgramApprovalThresholds({
  programId,
  thresholds,
  accessToken,
}: {
  programId: number;
  thresholds: any[];
  accessToken: string;
}): Promise<request.Response> {
  return await getServer()
    .put(`/programs/${programId}/approval-thresholds`)
    .set('Cookie', [accessToken])
    .send(thresholds);
}

export async function getProgramApprovalThresholds({
  programId,
  accessToken,
}: {
  programId: number;
  accessToken: string;
}): Promise<request.Response> {
  return await getServer()
    .get(`/programs/${programId}/approval-thresholds`)
    .set('Cookie', [accessToken]);
}

export async function getApprovers({
  programId,
  accessToken,
}: {
  programId: number;
  accessToken: string;
}): Promise<any[]> {
  const thresholdsResponse = await getServer()
    .get(`/programs/${programId}/approval-thresholds`)
    .set('Cookie', [accessToken]);

  if (thresholdsResponse.status !== 200) {
    return [];
  }

  const approvers = thresholdsResponse.body.flatMap(
    (threshold: any) => threshold.approvers ?? [],
  );

  return approvers;
}
