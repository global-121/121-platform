import { Injectable } from '@nestjs/common';
import { DataSource, DeepPartial, Equal } from 'typeorm';

import { RegistrationAttributeDataEntity } from '@121-service/src/registration/entities/registration-attribute-data.entity';
import { BaseSeedFactory } from '@121-service/src/scripts/factories/base-seed-factory';
import { SeedAccessGroupService } from '@121-service/src/scripts/services/seed-access-group.service';

@Injectable()
export class RegistrationAttributeSeedFactory extends BaseSeedFactory<RegistrationAttributeDataEntity> {
  constructor(
    dataSource: DataSource,
    private readonly seedAccessGroupService: SeedAccessGroupService,
  ) {
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
      await this.seedAccessGroupService.getRandomAccessGroupValuesByRegistrationId({
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
