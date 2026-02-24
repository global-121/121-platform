import * as request from 'supertest';

import { getServer } from '@121-service/test/helpers/utility.helper';

export async function getUserRoles(
  accessToken: string,
): Promise<request.Response> {
  return getServer().get('/roles').set('Cookie', [accessToken]).send();
}

export async function getAllUsers(
  accessToken: string,
): Promise<request.Response> {
  return getServer().get('/users').set('Cookie', [accessToken]).send();
}

export async function getAllUsersByProgramId(
  accessToken: string,
  programId: string,
): Promise<request.Response> {
  return getServer()
    .get(`/programs/${programId}/users`)
    .set('Cookie', [accessToken])
    .send();
}

export async function createUserProgramAssignment({
  programId,
  userId,
  roles,
  scope,
  accessToken,
}: {
  programId: number;
  userId: number;
  roles?: string[];
  scope?: string;
  accessToken: string;
}): Promise<request.Response> {
  return await getServer()
    .put(`/programs/${programId}/users/${userId}`)
    .set('Cookie', [accessToken])
    .send({
      roles,
      scope,
    });
}

export async function updateUserProgramAssignment({
  programId,
  userId,
  roles,
  scope,
  accessToken,
}: {
  programId: number;
  userId: number;
  roles?: string[];
  scope?: string;
  accessToken: string;
}): Promise<request.Response> {
  return await getServer()
    .patch(`/programs/${programId}/users/${userId}`)
    .set('Cookie', [accessToken])
    .send({
      rolesToAdd: roles,
      scope,
    });
}

export async function getCurrentUser({
  accessToken,
}: {
  accessToken: string;
}): Promise<request.Response> {
  return await getServer().get('/users/current').set('Cookie', [accessToken]);
}

export async function getApprovers({
  programId,
  accessToken,
}: {
  programId: number;
  accessToken: string;
}): Promise<request.Response> {
  // Get thresholds which now include approvers
  const thresholdsResponse = await getServer()
    .get(`/programs/${programId}/approval-thresholds`)
    .set('Cookie', [accessToken]);

  if (thresholdsResponse.status !== 200) {
    return thresholdsResponse;
  }

  // Flatten all approvers from all thresholds
  const approvers = thresholdsResponse.body.flatMap(
    (threshold: any) => threshold.approvers || [],
  );

  // Return with same structure but flattened approvers
  const mockResponse: any = {
    ...thresholdsResponse,
    body: approvers,
  };
  return mockResponse as request.Response;
}

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
    .post(`/programs/${programId}/approval-thresholds`)
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

// Deprecated: Use replaceProgramApprovalThresholds instead
export async function createApprover({
  programId: _programId,
  userId: _userId,
  order: _order,
  accessToken: _accessToken,
}: {
  programId: number;
  userId: number;
  order: number;
  accessToken: string;
}): Promise<request.Response> {
  throw new Error(
    'createApprover is deprecated. Approvers must be created via thresholds endpoint using replaceProgramApprovalThresholds()',
  );
}

// Deprecated: Use replaceProgramApprovalThresholds instead
export async function updateApprover({
  programId: _programId,
  approverId: _approverId,
  order: _order,
  accessToken: _accessToken,
}: {
  programId: number;
  approverId: number;
  order: number;
  accessToken: string;
}): Promise<request.Response> {
  throw new Error(
    'updateApprover is deprecated. Approvers must be updated via thresholds endpoint using replaceProgramApprovalThresholds()',
  );
}

// Deprecated: Use replaceProgramApprovalThresholds instead
export async function deleteApprover({
  programId: _programId,
  approverId: _approverId,
  accessToken: _accessToken,
}: {
  programId: number;
  approverId: number;
  accessToken: string;
}): Promise<request.Response> {
  throw new Error(
    'deleteApprover is deprecated. Approvers must be deleted via thresholds endpoint using replaceProgramApprovalThresholds()',
  );
}
