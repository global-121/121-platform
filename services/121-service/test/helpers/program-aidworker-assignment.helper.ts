import { getAllUsersByProgramId } from '@121-service/test/helpers/user.helper';

export async function findAidworkerAssignmentIdByUserId({
  programId,
  userId,
  accessToken,
}: {
  programId: number;
  userId: number;
  accessToken: string;
}): Promise<number> {
  const response = await getAllUsersByProgramId({
    programId,
    accessToken,
  });

  if (response.status !== 200) {
    throw new Error(
      `Failed to get aidworker assignments: ${response.status} ${response.body.message}`,
    );
  }

  const assignment = response.body.find((a: any) => a.id === userId);
  if (!assignment) {
    throw new Error(
      `Aidworker assignment not found for user ${userId} in program ${programId}`,
    );
  }

  return assignment.programAidworkerAssignmentId;
}
