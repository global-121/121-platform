import { AccessGroupLevelAssignment } from '@121-service/src/programs/program-aidworker-assignments/interfaces/access-group-level-assignment.interface';

export interface ReplaceAccessGroupsParams {
  readonly programAidworkerAssignmentId: number;
  readonly accessGroups: AccessGroupLevelAssignment[] | undefined;
}
