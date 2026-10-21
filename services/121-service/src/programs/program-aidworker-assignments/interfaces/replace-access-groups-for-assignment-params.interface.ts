import { AssignedAccessGroupResult } from '@121-service/src/programs/access-group-levels/interfaces/assigned-access-group-result.interface';

export interface ReplaceAccessGroupsForAssignmentParams {
  readonly programAidworkerAssignmentId: number;
  readonly accessGroups: readonly AssignedAccessGroupResult[];
}
