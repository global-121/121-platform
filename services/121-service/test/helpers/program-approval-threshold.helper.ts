import { HttpStatus } from '@nestjs/common';
import * as request from 'supertest';

import { ApproverInThresholdResponseDto } from '@121-service/src/programs/program-approval-thresholds/dtos/approver-in-threshold-response.dto';
import { CreateProgramApprovalThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/create-program-approval-threshold.dto';
import { GetProgramApprovalThresholdResponseDto } from '@121-service/src/programs/program-approval-thresholds/dtos/get-program-approval-threshold-response.dto';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import {
  createUserWithPermissions,
  getAccessToken,
  getServer,
} from '@121-service/test/helpers/utility.helper';

export async function createOrReplaceProgramApprovalThresholds({
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

/**
 * Replaces the thresholds with a single threshold of 0, with the user as the only approver.
 * Throws when it fails, so it can be used to arrange a test.
 */
export async function assignUserAsApprover({
  programId,
  userId,
  accessToken,
}: {
  programId: number;
  userId: number;
  accessToken: string;
}): Promise<void> {
  const response = await createOrReplaceProgramApprovalThresholds({
    programId,
    thresholds: [{ thresholdAmount: 0, userIds: [userId] }],
    accessToken,
  });

  if (response.status !== HttpStatus.CREATED) {
    throw new Error(
      `Failed to assign user as approver: ${response.status} - ${JSON.stringify(response.body)}`,
    );
  }
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
}): Promise<ApproverInThresholdResponseDto[]> {
  const thresholdsResponse = await getProgramApprovalThresholds({
    programId,
    accessToken,
  });

  if (thresholdsResponse.status !== HttpStatus.OK) {
    throw new Error(
      `Failed to get program approval thresholds for programId ${programId}`,
    );
  }

  const thresholds: GetProgramApprovalThresholdResponseDto[] =
    thresholdsResponse.body;

  return thresholds.flatMap((threshold) => threshold.approvers ?? []);
}

/**
 * Creates a dedicated user for managing approval thresholds,
 * avoiding self-assignment issues when approvers include the main admin user.
 */
export async function createOrReplaceProgramApprovalThresholdsWithNewUser({
  programId,
  thresholds,
}: {
  programId: number;
  thresholds: CreateProgramApprovalThresholdDto[];
}): Promise<request.Response> {
  const adminAccessToken = await getAccessToken();

  const thresholdManager = await createUserWithPermissions({
    permissions: [PermissionEnum.ProgramApprovalThresholdsUPDATE],
    programId,
    adminAccessToken,
  });

  const thresholdManagerAccessToken = await getAccessToken(
    thresholdManager.username,
    thresholdManager.password,
  );

  return await createOrReplaceProgramApprovalThresholds({
    programId,
    thresholds,
    accessToken: thresholdManagerAccessToken,
  });
}
