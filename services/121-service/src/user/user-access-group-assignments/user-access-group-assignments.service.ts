import { HttpStatus, Injectable } from '@nestjs/common';
import { HttpException } from '@nestjs/common/exceptions/http.exception';

import { IS_PRODUCTION } from '@121-service/src/config';
import { AccessGroupLevelRepository } from '@121-service/src/programs/access-group-levels/access-group-level.repository';
import { AssignedAccessGroupResult } from '@121-service/src/programs/access-group-levels/interfaces/assigned-access-group-result.interface';
import { AccessGroupLevelAssignment } from '@121-service/src/programs/program-aidworker-assignments/interfaces/access-group-level-assignment.interface';
import { ProgramAidworkerAssignmentAccessGroupRepository } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignment-access-group.repository';
import { AssignedAccessGroupDto } from '@121-service/src/user/dto/assigned-access-group.dto';
import { GetAccessGroupsForUserParams } from '@121-service/src/user/user-access-group-assignments/interfaces/get-access-groups-for-user-params.interface';
import { GetAccessGroupsWithLevelIdsParams } from '@121-service/src/user/user-access-group-assignments/interfaces/get-access-groups-with-level-ids-params.interface';
import { ReplaceAccessGroupsParams } from '@121-service/src/user/user-access-group-assignments/interfaces/replace-access-groups-params.interface';

@Injectable()
export class UserAccessGroupAssignmentsService {
  public constructor(
    private readonly accessGroupLevelRepository: AccessGroupLevelRepository,
    private readonly assignmentAccessGroupRepository: ProgramAidworkerAssignmentAccessGroupRepository,
  ) {}

  public async getAccessGroupsWithLevelIdsOrThrow({
    programId,
    accessGroups,
  }: GetAccessGroupsWithLevelIdsParams): Promise<
    AccessGroupLevelAssignment[] | undefined
  > {
    this.throwIfProduction({ accessGroups });
    if (accessGroups === undefined) {
      return undefined;
    }

    const levelIdByAttributeName =
      await this.accessGroupLevelRepository.getIdsByAttributeNames({
        programId,
        attributeNames: accessGroups.map(
          ({ programRegistrationAttributeName }) =>
            programRegistrationAttributeName,
        ),
      });

    return accessGroups.map(({ programRegistrationAttributeName, value }) => {
      const accessGroupLevelId = levelIdByAttributeName.get(
        programRegistrationAttributeName,
      );
      if (accessGroupLevelId === undefined) {
        throw new HttpException(
          `Registration attribute '${programRegistrationAttributeName}' is not configured as an access group level in program ${programId}`,
          HttpStatus.BAD_REQUEST,
        );
      }
      return { accessGroupLevelId, value };
    });
  }

  // undefined leaves the existing access groups untouched, an empty array replaces them with none
  public async replaceAccessGroups({
    programAidworkerAssignmentId,
    accessGroups,
  }: ReplaceAccessGroupsParams): Promise<void> {
    if (accessGroups === undefined) {
      return;
    }

    await this.assignmentAccessGroupRepository.replaceForAssignment({
      programAidworkerAssignmentId,
      accessGroups,
    });
  }

  public getAccessGroupsForUser({
    programAssignments,
    programId,
  }: GetAccessGroupsForUserParams): AssignedAccessGroupResult[] {
    const assignment = programAssignments.find(
      (programAssignment) => programAssignment.programId === Number(programId),
    );
    if (!assignment) {
      return [];
    }

    return assignment.accessGroups.map(({ accessGroupLevel, value }) => ({
      programRegistrationAttributeId:
        accessGroupLevel.programRegistrationAttributeId,
      value,
    }));
  }

  // TODO: Setting access groups is not validated yet (value must be one of the level's options, levels must be a prefix). Until then it is disabled in production.
  // It will follow in a new PR
  private throwIfProduction({
    accessGroups,
  }: {
    accessGroups: AssignedAccessGroupDto[] | undefined;
  }): void {
    if (accessGroups === undefined || !IS_PRODUCTION) {
      return;
    }

    throw new HttpException(
      'Setting access groups is not available yet',
      HttpStatus.BAD_REQUEST,
    );
  }
}
