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

  if (response.status !== 200) {
    throw new Error(
      `Failed to get aidworker assignment: ${response.status} ${response.body.message}`,
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
  // First get all users to find the userId
  const usersResponse = await getServer()
    .get(`/programs/${programId}/users`)
    .set('Cookie', [accessToken]);

  if (usersResponse.status !== 200) {
    throw new Error(
      `Failed to get users: ${usersResponse.status} ${usersResponse.body.message}`,
    );
  }

  const user = usersResponse.body.find((u: any) => u.username === username);
  if (!user) {
    throw new Error(
      `User with username ${username} not found in program ${programId}`,
    );
  }

  // Then get the assignment
  return findAidworkerAssignmentIdByUserId({
    programId,
    userId: user.id,
    accessToken,
  });
}
