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

export function requestLoginOneTimePassword({
  username,
}: {
  username: string;
}): Promise<request.Response> {
  return getServer().post('/users/one-time-password').send({ username });
}

export function loginWithOneTimePassword({
  username,
  oneTimePassword,
}: {
  username: string;
  oneTimePassword: string;
}): Promise<request.Response> {
  return getServer().post('/users/login/one-time-password').send({ username, oneTimePassword });
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
