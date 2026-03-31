import { HttpStatus } from '@nestjs/common';
import * as request from 'supertest';

import { env } from '@121-service/src/env';
import { ApproverInThresholdResponseDto } from '@121-service/src/programs/program-approval-thresholds/dtos/approver-in-threshold-response.dto';
import { CreateProgramApprovalThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/create-program-approval-threshold.dto';
import { GetProgramApprovalThresholdResponseDto } from '@121-service/src/programs/program-approval-thresholds/dtos/get-program-approval-threshold-response.dto';
import { getAllUsers } from '@121-service/test/helpers/user.helper';
import {
  createUser,
  generateUniqueTestId,
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
 * Creates a dedicated org admin user for managing approval thresholds,
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

  const username = `threshold_admin_${generateUniqueTestId()}@example.org`;

  await createUser({
    username,
    displayName: 'Threshold Admin',
    adminAccessToken,
  });

  // Find the newly created user because we need their ID to assign them to the program and promote them to org admin
  const allUsersResponse = await getAllUsers(adminAccessToken);
  const thresholdAdminUser = allUsersResponse.body.find(
    (u: { username: string }) => u.username === username,
  );
  if (!thresholdAdminUser) {
    throw new Error('Failed to find newly created threshold admin user');
  }

  // Promote to organization admin so they can manage approval thresholds
  const promoteResponse = await getServer()
    .patch(`/users/${thresholdAdminUser.id}`)
    .set('Cookie', [adminAccessToken])
    .send({ isOrganizationAdmin: true });

  if (promoteResponse.status !== HttpStatus.OK) {
    throw new Error(
      `Failed to promote threshold admin to organization admin: ${promoteResponse.status}`,
    );
  }

  const accessToken = await getAccessToken(
    username,
    env.USERCONFIG_121_SERVICE_PASSWORD_TESTING,
  );

  return await createOrReplaceProgramApprovalThresholds({
    programId,
    thresholds,
    accessToken,
  });
}
