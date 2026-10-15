import { HttpStatus, Injectable } from '@nestjs/common';
import { HttpException } from '@nestjs/common/exceptions/http.exception';

import { IS_PRODUCTION } from '@121-service/src/config';
import { AssignedAccessGroupResult } from '@121-service/src/programs/access-group-levels/interfaces/assigned-access-group-result.interface';
import { ProgramAidworkerAssignmentAccessGroupRepository } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignment-access-group.repository';
import { ProgramRegistrationAttributeRepository } from '@121-service/src/programs/repositories/program-registration-attribute.repository';
import { AssignedAccessGroupDto } from '@121-service/src/user/dto/assigned-access-group.dto';
import { GetAccessGroupsForUserParams } from '@121-service/src/user/user-access-group-assignments/interfaces/get-access-groups-for-user-params.interface';
import { GetAccessGroupsWithAttributeIdsParams } from '@121-service/src/user/user-access-group-assignments/interfaces/get-access-groups-with-attribute-ids-params.interface';
import { ReplaceAccessGroupsParams } from '@121-service/src/user/user-access-group-assignments/interfaces/replace-access-groups-params.interface';

@Injectable()
export class UserAccessGroupAssignmentsService {
  public constructor(
    private readonly programRegistrationAttributeRepository: ProgramRegistrationAttributeRepository,
    private readonly assignmentAccessGroupRepository: ProgramAidworkerAssignmentAccessGroupRepository,
  ) {}

  public async getAccessGroupsWithAttributeIdsOrThrow({
    programId,
    accessGroups,
  }: GetAccessGroupsWithAttributeIdsParams): Promise<
    AssignedAccessGroupResult[] | undefined
  > {
    this.throwIfNotProduction({ accessGroups });
    if (accessGroups === undefined) {
      return undefined;
    }

    const attributeIdByName =
      await this.programRegistrationAttributeRepository.getIdsByNames({
        programId,
        names: accessGroups.map(
          ({ programRegistrationAttributeName }) =>
            programRegistrationAttributeName,
        ),
      });

    return accessGroups.map(({ programRegistrationAttributeName, value }) => {
      const programRegistrationAttributeId = attributeIdByName.get(
        programRegistrationAttributeName,
      );
      if (programRegistrationAttributeId === undefined) {
        throw new HttpException(
          `Registration attribute '${programRegistrationAttributeName}' not found in program ${programId}`,
          HttpStatus.BAD_REQUEST,
        );
      }
      return { programRegistrationAttributeId, value };
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

    return assignment.accessGroups.map(
      ({ programRegistrationAttributeId, value }) => ({
        programRegistrationAttributeId,
        value,
      }),
    );
  }

  // TODO: Setting access groups is not validated yet (attribute must be a configured access group level, value must be one of its options, levels must be a prefix). Until then it is disabled in production.
  // It will follow in a new PR
  private throwIfNotProduction({
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
