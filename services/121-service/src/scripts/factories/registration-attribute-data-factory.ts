import { Injectable } from '@nestjs/common';
import { DataSource, DeepPartial } from 'typeorm';

import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationAttributeDataEntity } from '@121-service/src/registration/entities/registration-attribute-data.entity';
import { BaseDataFactory } from '@121-service/src/scripts/factories/base-data-factory';

interface RegistrationAttributeDataFactoryOptions {
  readonly programRegistrationAttributeId: number;
  readonly value: string;
}

@Injectable()
export class RegistrationAttributeDataFactory extends BaseDataFactory<RegistrationAttributeDataEntity> {
  constructor(dataSource: DataSource) {
    super(
      dataSource,
      dataSource.getRepository(RegistrationAttributeDataEntity),
    );
  }

  /**
   * Generate mock registration attribute data for specific registrations
   */
  public async generateMockData(
    count: number,
    registrationIds: number[],
    attributeData: RegistrationAttributeDataFactoryOptions[],
  ): Promise<RegistrationAttributeDataEntity[]> {
    console.log(
      `Generating registration attribute data for ${registrationIds.length} registrations`,
    );

    const attributeDataEntries: DeepPartial<RegistrationAttributeDataEntity>[] =
      [];

    for (const registrationId of registrationIds) {
      for (const attr of attributeData) {
        attributeDataEntries.push({
          registrationId,
          programRegistrationAttributeId: attr.programRegistrationAttributeId,
          value: attr.value,
        });
      }
    }

    return await this.createEntitiesBatch(attributeDataEntries);
  }

  /**
   * Duplicate existing registration attribute data (replaces mock-registration-data.sql)
   */
  public async duplicateExistingAttributeData(
    multiplier: number,
  ): Promise<RegistrationAttributeDataEntity[]> {
    console.log(
      `Duplicating existing registration attribute data ${multiplier} times`,
    );

    // Get all existing attribute data
    const existingAttributeData = await this.repository.find();

    if (existingAttributeData.length === 0) {
      console.warn(
        'No existing registration attribute data found to duplicate',
      );
      return [];
    }

    const allNewAttributeData: RegistrationAttributeDataEntity[] = [];

    for (let iteration = 1; iteration <= multiplier; iteration++) {
      console.log(
        `Creating registration attribute data duplication ${iteration} of ${multiplier}`,
      );

      // Get the current max registrationId from registration_attribute_data table
      // This follows the original SQL logic: registrationId + (SELECT max(registrationId) FROM registration_attribute_data)
      const maxRegistrationIdResult = await this.repository
        .createQueryBuilder('rad')
        .select('MAX(rad.registrationId)', 'max')
        .getRawOne();

      const maxRegistrationId = maxRegistrationIdResult?.max || 0;

      const newAttributeDataEntries: DeepPartial<RegistrationAttributeDataEntity>[] =
        existingAttributeData.map((attributeData) => ({
          registrationId: attributeData.registrationId + maxRegistrationId,
          programRegistrationAttributeId:
            attributeData.programRegistrationAttributeId,
          value: attributeData.value,
        }));

      const newAttributeData = await this.createEntitiesBatch(
        newAttributeDataEntries,
      );
      allNewAttributeData.push(...newAttributeData);
    }

    console.log(
      `Created ${allNewAttributeData.length} new registration attribute data entries`,
    );
    return allNewAttributeData;
  }

  /**
   * Duplicate attribute data for specific new registrations (maintains relationships)
   */
  public async duplicateAttributeDataForRegistrations(
    newRegistrations: RegistrationEntity[],
  ): Promise<RegistrationAttributeDataEntity[]> {
    console.log(
      `Creating registration attribute data for ${newRegistrations.length} new registrations`,
    );

    // Get all existing attribute data
    const existingAttributeData = await this.repository.find();

    if (existingAttributeData.length === 0) {
      console.warn(
        'No existing registration attribute data found to duplicate',
      );
      return [];
    }

    // Create mapping of old registration IDs to new registration IDs
    const oldRegistrationIds = [
      ...new Set(existingAttributeData.map((ad) => ad.registrationId)),
    ].sort((a, b) => a - b); // Sort to ensure consistent mapping

    // For each old registration ID, find the corresponding new registration ID
    const registrationIdMapping = new Map<number, number>();
    for (
      let i = 0;
      i < oldRegistrationIds.length && i < newRegistrations.length;
      i++
    ) {
      registrationIdMapping.set(oldRegistrationIds[i], newRegistrations[i].id);
    }

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
          value: attributeData.value,
        });
      }
    }

    if (newAttributeDataEntries.length === 0) {
      console.warn('No attribute data entries to create');
      return [];
    }

    const newAttributeData = await this.createEntitiesBatch(
      newAttributeDataEntries,
    );

    console.log(
      `Created ${newAttributeData.length} new registration attribute data entries`,
    );
    return newAttributeData;
  }

  /**
   * Generate mock attribute data for new registrations based on existing patterns
   */
  public async generateAttributeDataForRegistrations(
    registrations: RegistrationEntity[],
  ): Promise<RegistrationAttributeDataEntity[]> {
    console.log(
      `Generating attribute data for ${registrations.length} new registrations`,
    );

    // Get existing attribute patterns for each program
    const programAttributePatterns = new Map<
      number,
      RegistrationAttributeDataFactoryOptions[]
    >();

    for (const registration of registrations) {
      if (!programAttributePatterns.has(registration.programId)) {
        // Get sample attribute data for this program
        const sampleAttributes = await this.repository
          .createQueryBuilder('attributeData')
          .innerJoin('attributeData.registration', 'registration')
          .innerJoin('attributeData.programRegistrationAttribute', 'attribute')
          .select([
            'attributeData.programRegistrationAttributeId',
            'attributeData.value',
          ])
          .where('registration.programId = :programId', {
            programId: registration.programId,
          })
          .limit(10) // Get sample patterns
          .getMany();

        const patterns = sampleAttributes.map((attr) => ({
          programRegistrationAttributeId: attr.programRegistrationAttributeId,
          value: attr.value,
        }));

        programAttributePatterns.set(registration.programId, patterns);
      }
    }

    const allAttributeData: RegistrationAttributeDataEntity[] = [];

    for (const registration of registrations) {
      const patterns =
        programAttributePatterns.get(registration.programId) || [];

      if (patterns.length > 0) {
        const attributeData = await this.generateMockData(
          1,
          [registration.id],
          patterns,
        );
        allAttributeData.push(...attributeData);
      }
    }

    return allAttributeData;
  }
}
