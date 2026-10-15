import { AssignedAccessGroupDto } from '@121-service/src/user/dto/assigned-access-group.dto';

export interface GetAccessGroupsWithAttributeIdsParams {
  readonly programId: number;
  readonly accessGroups: AssignedAccessGroupDto[] | undefined;
}
