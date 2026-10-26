import { Injectable } from '@nestjs/common';
import { DataSource, DeepPartial, Equal } from 'typeorm';

import { AccessGroupLevelEntity } from '@121-service/src/programs/access-group-levels/access-group-level.entity';
import { RegistrationAttributeDataEntity } from '@121-service/src/registration/entities/registration-attribute-data.entity';
import {
  findDebugAccessGroupHierarchy,
  getAccessGroupValuesByAttributeName,
  getDebugAccessGroupLeafPaths,
} from '@121-service/src/scripts/const/debug-access-group.const';
import { DebugAccessGroupHierarchy } from '@121-service/src/scripts/enum/debug-access-group-hierarchy.enum';
import { BaseSeedFactory } from '@121-service/src/scripts/factories/base-seed-factory';

@Injectable()
export class RegistrationAttributeSeedFactory extends BaseSeedFactory<RegistrationAttributeDataEntity> {
  constructor(dataSource: DataSource) {
    super(
      dataSource,
      dataSource.getRepository(RegistrationAttributeDataEntity),
    );
  }

  public async duplicateAttributeDataForRegistrations({
    newRegistrationIds,
    programId,
  }: {
    newRegistrationIds: number[];
    programId: number;
  }): Promise<void> {
    console.log(
      `Creating registration attribute data for ${newRegistrationIds.length} new registrations`,
    );

    // Get all existing attribute data
    const existingAttributeData = await this.repository.find({
      where: { registration: { programId: Equal(programId) } },
    });

    if (existingAttributeData.length === 0) {
      console.warn(
        'No existing registration attribute data found to duplicate',
      );
      return;
    }

    // Create mapping of old registration IDs to new registration IDs
    const oldRegistrationIds = [
      ...new Set(existingAttributeData.map((ad) => ad.registrationId)),
    ].sort((a, b) => a - b); // Sort to ensure consistent mapping

    // For each old registration ID, find the corresponding new registration ID
    const registrationIdMapping = new Map<number, number>();
    for (
      let i = 0;
      i < oldRegistrationIds.length && i < newRegistrationIds.length;
      i++
    ) {
      registrationIdMapping.set(oldRegistrationIds[i], newRegistrationIds[i]);
    }

    const accessGroupValuesByRegistrationId =
      await this.getRandomAccessGroupValuesByRegistrationId({
        newRegistrationIds,
        programId,
      });

    // Create new attribute data entries
    const newAttributeDataEntries: DeepPartial<RegistrationAttributeDataEntity>[] =
      [];
    for (const attributeData of existingAttributeData) {
      const newRegistrationId = registrationIdMapping.get(
        attributeData.registrationId,
      );
      if (newRegistrationId) {
        newAttributeDataEntries.push({
          registrationId: newRegistrationId,
          programRegistrationAttributeId:
            attributeData.programRegistrationAttributeId,
          value: this.getDuplicatedAttributeValue({
            attributeData,
            accessGroupValuesByAttributeId:
              accessGroupValuesByRegistrationId.get(newRegistrationId),
          }),
        });
      }
    }

    if (newAttributeDataEntries.length === 0) {
      console.warn('No attribute data entries to create');
      return;
    }

    const insertedIds = await this.insertEntitiesBatch(newAttributeDataEntries);

    console.log(
      `Created ${insertedIds.length} new registration attribute data entries`,
    );
    return;
  }

  // Spreads the duplicated registrations over the debug access groups, similar to how scope is randomized
  private async getRandomAccessGroupValuesByRegistrationId({
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
    const hierarchy = findDebugAccessGroupHierarchy({
      registrationAttributeNames: [...attributeIdByName.keys()],
    });
    if (!hierarchy) {
      return new Map();
    }

    const leafPaths = getDebugAccessGroupLeafPaths({ hierarchy });
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
    const valueByAttributeName = getAccessGroupValuesByAttributeName({
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

  private getDuplicatedAttributeValue({
    attributeData,
    accessGroupValuesByAttributeId,
  }: {
    attributeData: RegistrationAttributeDataEntity;
    accessGroupValuesByAttributeId: Map<number, string> | undefined;
  }): string {
    if (!accessGroupValuesByAttributeId) {
      return attributeData.value;
    }

    return (
      accessGroupValuesByAttributeId.get(
        attributeData.programRegistrationAttributeId,
      ) ?? attributeData.value
    );
  }
}
