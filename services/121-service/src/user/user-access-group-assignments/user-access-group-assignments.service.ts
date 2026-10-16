import { HttpStatus, Injectable } from '@nestjs/common';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { Equal } from 'typeorm';

import { AccessGroupLevelsService } from '@121-service/src/programs/access-group-levels/access-group-levels.service';
import { AccessGroupLevelAttribute } from '@121-service/src/programs/access-group-levels/interfaces/access-group-level-attribute.interface';
import { AssignedAccessGroupResult } from '@121-service/src/programs/access-group-levels/interfaces/assigned-access-group-result.interface';
import { ProgramAidworkerAssignmentAccessGroupRepository } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignment-access-group.repository';
import { AssignedAccessGroupDto } from '@121-service/src/user/dto/assigned-access-group.dto';
import { GetAccessGroupsForUserParams } from '@121-service/src/user/user-access-group-assignments/interfaces/get-access-groups-for-user-params.interface';
import { GetAccessGroupsOfAssignmentParams } from '@121-service/src/user/user-access-group-assignments/interfaces/get-access-groups-of-assignment-params.interface';
import { ReplaceAccessGroupsParams } from '@121-service/src/user/user-access-group-assignments/interfaces/replace-access-groups-params.interface';
import { ValidateAndResolveAccessGroupsParams } from '@121-service/src/user/user-access-group-assignments/interfaces/validate-and-resolve-access-groups-params.interface';

interface AccessGroupWithLevel {
  readonly level: AccessGroupLevelAttribute;
  readonly value: string;
}

@Injectable()
export class UserAccessGroupAssignmentsService {
  public constructor(
    private readonly accessGroupLevelsService: AccessGroupLevelsService,
    private readonly assignmentAccessGroupRepository: ProgramAidworkerAssignmentAccessGroupRepository,
  ) {}

  // undefined means the access groups are not part of the request, an empty array means no access groups (unrestricted)
  // The options of a level are not related to the options of the other levels, so a combination like 'zuid-holland' + 'haarlem' cannot be rejected
  public async validateAndResolveAccessGroups({
    programId,
    accessGroups,
  }: ValidateAndResolveAccessGroupsParams): Promise<
    AssignedAccessGroupResult[] | undefined
  > {
    if (accessGroups === undefined) {
      return undefined;
    }
    if (accessGroups.length === 0) {
      return [];
    }

    const levels =
      await this.accessGroupLevelsService.getAccessGroupLevelAttributes({
        programId,
      });
    this.throwIfNoLevelsConfigured({ programId, levels });

    const accessGroupsWithLevel = this.getAccessGroupsWithLevelOrThrow({
      programId,
      levels,
      accessGroups,
    });
    this.throwIfLevelIsProvidedMoreThanOnce({ accessGroupsWithLevel });
    this.throwIfLevelsAreSkipped({ levels, accessGroupsWithLevel });
    this.throwIfValueIsNotAnOption({ accessGroupsWithLevel });

    return accessGroupsWithLevel.map(({ level, value }) => ({
      programRegistrationAttributeId: level.programRegistrationAttributeId,
      value,
    }));
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

  // Ordered from the highest level down, so the order matches how the levels are configured for the program
  public async getAccessGroupsOfAssignment({
    programAidworkerAssignmentId,
    programId,
  }: GetAccessGroupsOfAssignmentParams): Promise<AssignedAccessGroupDto[]> {
    const accessGroups = await this.assignmentAccessGroupRepository.find({
      where: {
        programAidworkerAssignmentId: Equal(programAidworkerAssignmentId),
      },
      relations: { programRegistrationAttribute: true },
    });
    if (accessGroups.length === 0) {
      return [];
    }

    const levelNames =
      await this.accessGroupLevelsService.getAccessGroupRegistrationAttributeNames(
        { programId },
      );
    const assignedAccessGroups = accessGroups.map(
      ({ programRegistrationAttribute, value }) => ({
        programRegistrationAttributeName: programRegistrationAttribute.name,
        value,
      }),
    );

    return this.sortFromHighestLevelDown({ assignedAccessGroups, levelNames });
  }

  // An access group can be of an attribute that is no longer a level, when the levels were changed after the access group was assigned. Those come last.
  private sortFromHighestLevelDown({
    assignedAccessGroups,
    levelNames,
  }: {
    assignedAccessGroups: AssignedAccessGroupDto[];
    levelNames: string[];
  }): AssignedAccessGroupDto[] {
    const getLevelIndex = ({
      programRegistrationAttributeName,
    }: AssignedAccessGroupDto): number => {
      const levelIndex = levelNames.indexOf(programRegistrationAttributeName);
      return levelIndex === -1 ? levelNames.length : levelIndex;
    };

    return assignedAccessGroups.toSorted(
      (first, second) => getLevelIndex(first) - getLevelIndex(second),
    );
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

  private throwIfNoLevelsConfigured({
    programId,
    levels,
  }: {
    programId: number;
    levels: AccessGroupLevelAttribute[];
  }): void {
    if (levels.length > 0) {
      return;
    }

    throw new HttpException(
      `No access group levels are configured for program ${programId}`,
      HttpStatus.BAD_REQUEST,
    );
  }

  private getAccessGroupsWithLevelOrThrow({
    programId,
    levels,
    accessGroups,
  }: {
    programId: number;
    levels: AccessGroupLevelAttribute[];
    accessGroups: AssignedAccessGroupDto[];
  }): AccessGroupWithLevel[] {
    const levelByName = new Map(levels.map((level) => [level.name, level]));

    return accessGroups.map(({ programRegistrationAttributeName, value }) => {
      const level = levelByName.get(programRegistrationAttributeName);
      if (!level) {
        throw new HttpException(
          `Registration attribute '${programRegistrationAttributeName}' is not an access group level of program ${programId}`,
          HttpStatus.BAD_REQUEST,
        );
      }
      return { level, value };
    });
  }

  private throwIfLevelIsProvidedMoreThanOnce({
    accessGroupsWithLevel,
  }: {
    accessGroupsWithLevel: AccessGroupWithLevel[];
  }): void {
    const providedLevelNames = new Set<string>();
    for (const { level } of accessGroupsWithLevel) {
      if (providedLevelNames.has(level.name)) {
        throw new HttpException(
          `Access group level '${level.name}' is provided more than once`,
          HttpStatus.BAD_REQUEST,
        );
      }
      providedLevelNames.add(level.name);
    }
  }

  // The provided levels have to be the highest levels, e.g. for the levels province > municipality > district the options are:
  // province / province + municipality / province + municipality + district
  private throwIfLevelsAreSkipped({
    levels,
    accessGroupsWithLevel,
  }: {
    levels: AccessGroupLevelAttribute[];
    accessGroupsWithLevel: AccessGroupWithLevel[];
  }): void {
    const providedLevelNames = new Set(
      accessGroupsWithLevel.map(({ level }) => level.name),
    );
    const skippedLevel = levels
      .slice(0, providedLevelNames.size)
      .find(({ name }) => !providedLevelNames.has(name));
    if (!skippedLevel) {
      return;
    }

    const levelNames = levels.map(({ name }) => name).join(', ');
    throw new HttpException(
      `Access groups must start at the highest level and cannot skip levels. Configured levels, highest first: ${levelNames}. Missing level: '${skippedLevel.name}'`,
      HttpStatus.BAD_REQUEST,
    );
  }

  private throwIfValueIsNotAnOption({
    accessGroupsWithLevel,
  }: {
    accessGroupsWithLevel: AccessGroupWithLevel[];
  }): void {
    for (const { level, value } of accessGroupsWithLevel) {
      if (!level.optionValues.has(value)) {
        throw new HttpException(
          `Value '${value}' is not an option of access group level '${level.name}'`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }
}
