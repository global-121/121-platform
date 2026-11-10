import { AssignedAccessGroupDto } from '@121-service/src/user/dto/assigned-access-group.dto';

export interface ValidateAndResolveAccessGroupsParams {
  readonly programId: number;
  readonly accessGroups: AssignedAccessGroupDto[] | undefined;
}
