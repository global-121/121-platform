import { Injectable } from '@nestjs/common';
import { DataSource, Equal } from 'typeorm';

import { AccessGroupLevelEntity } from '@121-service/src/programs/access-group-levels/access-group-level.entity';
import {
  DEBUG_ACCESS_GROUP_HIERARCHIES,
  DebugAccessGroupHierarchyDefinition,
} from '@121-service/src/scripts/const/debug-access-group-hierarchies.const';
import { DebugAccessGroupHierarchy } from '@121-service/src/scripts/enum/debug-access-group-hierarchy.enum';
import type { AssignedAccessGroupDto } from '@121-service/src/user/dto/assigned-access-group.dto';

const ACCESS_GROUP_PATH_SEPARATOR = '/';

@Injectable()
export class SeedAccessGroupService {
  constructor(private readonly dataSource: DataSource) {}

  public getRegistrationAttributeNames({
    hierarchy,
  }: {
    hierarchy: DebugAccessGroupHierarchy;
  }): string[] {
    return [...this.getHierarchyDefinition({ hierarchy }).registrationAttributeNames];
  }

  public getLeafPaths({
    hierarchy,
  }: {
    hierarchy: DebugAccessGroupHierarchy;
  }): string[] {
    return [...this.getHierarchyDefinition({ hierarchy }).leafPaths];
  }

  // Ordered from the highest level down, so higher level users are created first
  public getPaths({
    hierarchy,
  }: {
    hierarchy: DebugAccessGroupHierarchy;
  }): string[] {
    const { registrationAttributeNames, leafPaths } =
      this.getHierarchyDefinition({ hierarchy });
    const paths = new Set<string>();

    for (let depth = 1; depth <= registrationAttributeNames.length; depth++) {
      for (const leafPath of leafPaths) {
        paths.add(
          leafPath
            .split(ACCESS_GROUP_PATH_SEPARATOR)
            .slice(0, depth)
            .join(ACCESS_GROUP_PATH_SEPARATOR),
        );
      }
    }

    return [...paths];
  }

  public getAccessGroupAssignments({
    hierarchy,
    path,
  }: {
    hierarchy: DebugAccessGroupHierarchy;
    path: string;
  }): AssignedAccessGroupDto[] {
    const { registrationAttributeNames } = this.getHierarchyDefinition({
      hierarchy,
    });

    return path.split(ACCESS_GROUP_PATH_SEPARATOR).map((value, levelIndex) => {
      const programRegistrationAttributeName =
        registrationAttributeNames[levelIndex];
      if (!programRegistrationAttributeName) {
        throw new Error(`Unexpected access group level in "${path}"`);
      }

      return {
        programRegistrationAttributeName,
        value,
      };
    });
  }

  public getAccessGroupValuesByAttributeName({
    hierarchy,
    path,
  }: {
    hierarchy: DebugAccessGroupHierarchy;
    path: string;
  }): Map<string, string> {
    return new Map(
      this.getAccessGroupAssignments({ hierarchy, path }).map(
        ({ programRegistrationAttributeName, value }) => [
          programRegistrationAttributeName,
          value,
        ],
      ),
    );
  }

  public findHierarchyByAttributeNames({
    registrationAttributeNames,
  }: {
    registrationAttributeNames: string[];
  }): DebugAccessGroupHierarchy | undefined {
    for (const [hierarchy, definition] of DEBUG_ACCESS_GROUP_HIERARCHIES) {
      if (
        definition.registrationAttributeNames.join() ===
        registrationAttributeNames.join()
      ) {
        return hierarchy;
      }
    }
  }

  // Spreads the duplicated registrations over the debug access groups, similar to how scope is randomized
  public async getRandomAccessGroupValuesByRegistrationId({
    newRegistrationIds,
    programId,
  }: {
    newRegistrationIds: number[];
    programId: number;
  }): Promise<Map<number, Map<number, string>>> {
    const accessGroupLevels = await this.dataSource
      .getRepository(AccessGroupLevelEntity)
      .find({
        where: { programId: Equal(programId) },
        relations: { programRegistrationAttribute: true },
        order: { level: 'ASC' },
      });
    const attributeIdByName = new Map(
      accessGroupLevels.map(({ programRegistrationAttribute }) => [
        programRegistrationAttribute.name,
        programRegistrationAttribute.id,
      ]),
    );
    const hierarchy = this.findHierarchyByAttributeNames({
      registrationAttributeNames: [...attributeIdByName.keys()],
    });
    if (!hierarchy) {
      return new Map();
    }

    const leafPaths = this.getLeafPaths({ hierarchy });
    return new Map(
      newRegistrationIds.map((registrationId) => [
        registrationId,
        this.getRandomAccessGroupValuesByAttributeId({
          hierarchy,
          leafPaths,
          attributeIdByName,
        }),
      ]),
    );
  }

  private getRandomAccessGroupValuesByAttributeId({
    hierarchy,
    leafPaths,
    attributeIdByName,
  }: {
    hierarchy: DebugAccessGroupHierarchy;
    leafPaths: string[];
    attributeIdByName: Map<string, number>;
  }): Map<number, string> {
    const randomLeafPath =
      leafPaths[Math.floor(Math.random() * leafPaths.length)];
    const valueByAttributeName = this.getAccessGroupValuesByAttributeName({
      hierarchy,
      path: randomLeafPath,
    });

    const valueByAttributeId = new Map<number, string>();
    for (const [attributeName, value] of valueByAttributeName) {
      const attributeId = attributeIdByName.get(attributeName);
      if (attributeId) {
        valueByAttributeId.set(attributeId, value);
      }
    }
    return valueByAttributeId;
  }

  private getHierarchyDefinition({
    hierarchy,
  }: {
    hierarchy: DebugAccessGroupHierarchy;
  }): DebugAccessGroupHierarchyDefinition {
    const definition = DEBUG_ACCESS_GROUP_HIERARCHIES.get(hierarchy);
    if (!definition) {
      throw new Error(`Unknown debug access group hierarchy "${hierarchy}"`);
    }

    return definition;
  }
}
