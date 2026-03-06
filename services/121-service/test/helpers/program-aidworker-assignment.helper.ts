import { HttpStatus } from '@nestjs/common';

import { getServer } from '@121-service/test/helpers/utility.helper';

export async function findAidworkerAssignmentIdByUserId({
  programId,
  userId,
  accessToken,
}: {
  programId: number;
  userId: number;
  accessToken: string;
}): Promise<number> {
  const response = await getServer()
    .get(`/programs/${programId}/aidworker-assignments`)
    .query({ userId })
    .set('Cookie', [accessToken]);

  if (response.status !== HttpStatus.OK) {
    throw new Error(
      `Failed to find aidworker assignment for userId ${userId} in program ${programId}. Status: ${response.status}, Message: ${response.body.message || 'No error message'}`,
    );
  }

  return response.body.id;
}

export async function findAidworkerAssignmentIdByUsername({
  programId,
  username,
  accessToken,
}: {
  programId: number;
  username: string;
  accessToken: string;
}): Promise<number> {
  const usersResponse = await getServer()
    .get(`/programs/${programId}/users/search`)
    .query({ username })
    .set('Cookie', [accessToken]);

  if (usersResponse.body.length === 0) {
    throw new Error(`User with username ${username} not found`);
  }

  const user = usersResponse.body[0];

  return findAidworkerAssignmentIdByUserId({
    programId,
    userId: user.id,
    accessToken,
  });
}
