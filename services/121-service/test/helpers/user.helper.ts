import * as request from 'supertest';

import { AssignedAccessGroupDto } from '@121-service/src/user/dto/assigned-access-group.dto';
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

export async function getAllUsersByProgramId({
  accessToken,
  programId,
}: {
  accessToken: string;
  programId: number;
}): Promise<request.Response> {
  return getServer()
    .get(`/programs/${programId}/users`)
    .set('Cookie', [accessToken])
    .send();
}

export async function getUserProgramAssignment({
  programId,
  userId,
  accessToken,
}: {
  programId: number;
  userId: number;
  accessToken: string;
}): Promise<request.Response> {
  return await getServer()
    .get(`/programs/${programId}/users/${userId}`)
    .set('Cookie', [accessToken]);
}

export async function createUserProgramAssignment({
  programId,
  userId,
  roles,
  scope,
  accessGroups,
  accessToken,
}: {
  programId: number;
  userId: number;
  roles?: string[];
  scope?: string;
  accessGroups?: AssignedAccessGroupDto[];
  accessToken: string;
}): Promise<request.Response> {
  return await getServer()
    .put(`/programs/${programId}/users/${userId}`)
    .set('Cookie', [accessToken])
    .send({
      roles,
      scope,
      accessGroups,
    });
}

export async function updateUserProgramAssignment({
  programId,
  userId,
  roles,
  scope,
  accessGroups,
  accessToken,
}: {
  programId: number;
  userId: number;
  roles?: string[];
  scope?: string;
  accessGroups?: AssignedAccessGroupDto[];
  accessToken: string;
}): Promise<request.Response> {
  return await getServer()
    .patch(`/programs/${programId}/users/${userId}`)
    .set('Cookie', [accessToken])
    .send({
      rolesToAdd: roles,
      scope,
      accessGroups,
    });
}

export async function getCurrentUser({
  accessToken,
}: {
  accessToken: string;
}): Promise<request.Response> {
  return await getServer().get('/users/current').set('Cookie', [accessToken]);
}

export async function updateUser({
  userId,
  isOrganizationAdmin,
  displayName,
  accessToken,
}: {
  userId: number;
  isOrganizationAdmin?: boolean;
  displayName?: string;
  accessToken: string;
}): Promise<request.Response> {
  return await getServer()
    .patch(`/users/${userId}`)
    .set('Cookie', [accessToken])
    .send({
      isOrganizationAdmin,
      displayName,
    });
}
