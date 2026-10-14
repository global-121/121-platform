import { Injectable } from '@nestjs/common';
import chunk from 'lodash/chunk';
import { DataSource, DeepPartial, In } from 'typeorm';

import { RegistrationAttributeDataEntity } from '@121-service/src/registration/entities/registration-attribute-data.entity';
import { BaseSeedFactory } from '@121-service/src/scripts/factories/base-seed-factory';

const registrationsPerBatch = 2500;

@Injectable()
export class RegistrationAttributeSeedFactory extends BaseSeedFactory<RegistrationAttributeDataEntity> {
  constructor(dataSource: DataSource) {
    super(
      dataSource,
      dataSource.getRepository(RegistrationAttributeDataEntity),
    );
  }

  public async duplicateAttributeDataForRegistrations(
    newRegistrationIds: number[],
    programId: number,
  ): Promise<void> {
    console.log(
      `Creating registration attribute data for ${newRegistrationIds.length} new registrations`,
    );

    const oldRegistrationIds =
      await this.getRegistrationIdsWithAttributeData(programId);

    if (oldRegistrationIds.length === 0) {
      console.warn(
        'No existing registration attribute data found to duplicate',
      );
      return;
    }

    // For each old registration ID (sorted for a consistent mapping), find the corresponding new registration ID
    const registrationIdMapping = new Map<number, number>();
    for (
      let i = 0;
      i < oldRegistrationIds.length && i < newRegistrationIds.length;
      i++
    ) {
      registrationIdMapping.set(oldRegistrationIds[i], newRegistrationIds[i]);
    }

    // Batching keeps memory bounded; loading all rows at once exhausts the heap at 32k+ registrations
    let createdCount = 0;
    for (const oldIdsBatch of chunk(
      [...registrationIdMapping.keys()],
      registrationsPerBatch,
    )) {
      const existingAttributeData = await this.repository.find({
        select: {
          registrationId: true,
          programRegistrationAttributeId: true,
          value: true,
        },
        where: { registrationId: In(oldIdsBatch) },
      });

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
            value: attributeData.value,
          });
        }
      }

      const insertedIds = await this.insertEntitiesBatch(
        newAttributeDataEntries,
      );
      createdCount += insertedIds.length;
    }

    if (createdCount === 0) {
      console.warn('No attribute data entries to create');
      return;
    }

    console.log(
      `Created ${createdCount} new registration attribute data entries`,
    );
  }

  private async getRegistrationIdsWithAttributeData(
    programId: number,
  ): Promise<number[]> {
    const rows = await this.repository
      .createQueryBuilder('rad')
      .select('rad.registrationId', 'registrationId')
      .distinct(true)
      .innerJoin('rad.registration', 'registration')
      .where('registration.programId = :programId', { programId })
      .orderBy('rad.registrationId', 'ASC')
      .getRawMany<{ registrationId: number }>();

    return rows.map((row) => row.registrationId);
  }
}
