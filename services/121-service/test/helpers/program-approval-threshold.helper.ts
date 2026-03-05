import * as request from 'supertest';

import { ApproverResponseDto } from '@121-service/src/programs/program-approval-thresholds/dtos/approver-in-threshold-response.dto';
import { CreateProgramApprovalThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/create-program-approval-threshold.dto';
import { GetProgramApprovalThresholdResponseDto } from '@121-service/src/programs/program-approval-thresholds/dtos/get-program-approval-threshold-response.dto';
import { getServer } from '@121-service/test/helpers/utility.helper';

export async function replaceProgramApprovalThresholds({
  programId,
  thresholds,
  accessToken,
}: {
  programId: number;
  thresholds: CreateProgramApprovalThresholdDto[];
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
}): Promise<ApproverResponseDto[]> {
  const thresholdsResponse = await getServer()
    .get(`/programs/${programId}/approval-thresholds`)
    .set('Cookie', [accessToken]);

  const thresholds: GetProgramApprovalThresholdResponseDto[] =
    thresholdsResponse.body;

  return thresholds.flatMap((threshold) => threshold.approvers ?? []);
}
