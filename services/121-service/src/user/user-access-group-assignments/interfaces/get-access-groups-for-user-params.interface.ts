import { AssignedAccessGroupResult } from '@121-service/src/programs/access-group-levels/interfaces/assigned-access-group-result.interface';

export interface GetAccessGroupsForUserParams {
  readonly programAssignments: readonly {
    readonly programId: number;
    readonly accessGroups: readonly AssignedAccessGroupResult[];
  }[];
  readonly programId: number | string;
}
