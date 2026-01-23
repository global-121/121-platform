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
  return await getServer()
    .get(`/programs/${programId}/approvers`)
    .set('Cookie', [accessToken]);
}

export async function createApprover({
  programId,
  userId,
  order,
  accessToken,
}: {
  programId: number;
  userId: number;
  order: number;
  accessToken: string;
}): Promise<request.Response> {
  return await getServer()
    .post(`/programs/${programId}/approvers`)
    .set('Cookie', [accessToken])
    .send({
      userId,
      order,
    });
}

export async function updateApprover({
  programId,
  approverId,
  order,
  accessToken,
}: {
  programId: number;
  approverId: number;
  order: number;
  accessToken: string;
}): Promise<request.Response> {
  return await getServer()
    .patch(`/programs/${programId}/approvers/${approverId}`)
    .set('Cookie', [accessToken])
    .send({
      order,
    });
}

export async function deleteApprover({
  programId,
  approverId,
  accessToken,
}: {
  programId: number;
  approverId: number;
  accessToken: string;
}): Promise<request.Response> {
  return await getServer()
    .delete(`/programs/${programId}/approvers/${approverId}`)
    .set('Cookie', [accessToken]);
}
