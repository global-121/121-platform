import { Injectable } from '@nestjs/common';
import { DataSource, DeepPartial } from 'typeorm';

import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationAttributeDataEntity } from '@121-service/src/registration/entities/registration-attribute-data.entity';
import { BaseDataFactory } from '@121-service/src/scripts/factories/base-data-factory';
import { RegistrationAttributeDataFactory } from '@121-service/src/scripts/factories/registration-attribute-data-factory';

@Injectable()
export class RegistrationDataFactory extends BaseDataFactory<RegistrationEntity> {
  private readonly attributeDataFactory: RegistrationAttributeDataFactory;
  constructor(dataSource: DataSource) {
    super(dataSource, dataSource.getRepository(RegistrationEntity));
    this.attributeDataFactory = new RegistrationAttributeDataFactory(
      dataSource,
    );
  }

  /**
   * Duplicate existing registrations (similar to the SQL approach)
   */
  public async duplicateExistingRegistrations(): Promise<void> {
    console.log(`Duplicating existing registrations`);

    // Get all existing registrations
    const existingRegistrations = await this.repository.find();

    if (existingRegistrations.length === 0) {
      console.warn('No existing registrations found to duplicate');
      return;
    }

    // Get current max IDs for each program
    const programMaxIds = new Map<number, number>();
    const programs = [
      ...new Set(existingRegistrations.map((r) => r.programId)),
    ];

    for (const programId of programs) {
      const maxResult = await this.repository
        .createQueryBuilder('registration')
        .select('MAX(registration.registrationProgramId)', 'max')
        .where('registration.programId = :programId', { programId })
        .getRawOne();
      programMaxIds.set(programId, maxResult?.max || 0);
    }

    const newRegistrationsData: DeepPartial<RegistrationEntity>[] =
      existingRegistrations.map((registration) => {
        const currentMax = programMaxIds.get(registration.programId) || 0;
        const newRegistrationProgramId = currentMax + 1;
        programMaxIds.set(registration.programId, newRegistrationProgramId);

        return {
          programId: registration.programId,
          registrationStatus: registration.registrationStatus,
          referenceId: this.generateUniqueReferenceId(),
          phoneNumber: registration.phoneNumber,
          preferredLanguage: registration.preferredLanguage,
          inclusionScore: registration.inclusionScore,
          paymentAmountMultiplier: registration.paymentAmountMultiplier,
          registrationProgramId: newRegistrationProgramId,
          maxPayments: registration.maxPayments,
          paymentCount: registration.paymentCount,
          scope:
            registration.programId === 2
              ? Math.random() < 0.5
                ? 'kisumu.kisumu-west'
                : 'turkana.turkana-north'
              : registration.scope,
          programFspConfigurationId: registration.programFspConfigurationId,
        };
      });

    const newRegistrations =
      await this.createEntitiesBatch(newRegistrationsData);

    await this.attributeDataFactory.duplicateAttributeDataForRegistrations(
      newRegistrations,
    );
  }

  /**
   * Make phone numbers unique (replaces mock-make-phone-unique.sql)
   */
  public async makePhoneNumbersUnique(): Promise<void> {
    console.log('Making phone numbers unique');

    const registrations = await this.repository.find();
    const updates: { id: number; phoneNumber: string }[] = [];

    for (const registration of registrations) {
      updates.push({
        id: registration.id,
        phoneNumber: this.generatePhoneNumber(),
      });
    }

    // Update in batches
    const batchSize = 100;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      await Promise.all(
        batch.map(({ id, phoneNumber }) =>
          this.repository.update(id, { phoneNumber }),
        ),
      );
    }

    console.log(`Updated ${updates.length} phone numbers to be unique`);

    // Also update phone numbers in registration_attribute_data table
    await this.updatePhoneNumbersInAttributeData();
  }

  /**
   * Update phone numbers in registration_attribute_data table
   */
  private async updatePhoneNumbersInAttributeData(): Promise<void> {
    console.log('Updating phone numbers in registration attribute data');

    const attributeDataRepository = this.dataSource.getRepository(
      RegistrationAttributeDataEntity,
    );

    // Find phone number attributes
    const phoneAttributes = await attributeDataRepository
      .createQueryBuilder('rad')
      .innerJoin('rad.programRegistrationAttribute', 'pra')
      .where('pra.name IN (:...phoneNames)', {
        phoneNames: ['phoneNumber', 'whatsappPhoneNumber'],
      })
      .getMany();

    // Update each phone attribute with a new unique number
    const updates: { id: number; value: string }[] = [];
    for (const attribute of phoneAttributes) {
      const currentValue = attribute.value;
      const prefix = currentValue.substring(0, 2); // Keep country code prefix
      const newPhoneNumber =
        prefix + (100000000 + Math.floor(Math.random() * 900000000));
      updates.push({
        id: attribute.id,
        value: newPhoneNumber,
      });
    }

    // Update in batches
    const batchSize = 100;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      await Promise.all(
        batch.map(({ id, value }) =>
          attributeDataRepository.update(id, { value }),
        ),
      );
    }

    // Update registration table phone numbers to match attribute data
    for (const attribute of phoneAttributes) {
      if (attribute.programRegistrationAttribute?.name === 'phoneNumber') {
        const correspondingUpdate = updates.find((u) => u.id === attribute.id);
        if (correspondingUpdate) {
          await this.repository.update(attribute.registrationId, {
            phoneNumber: correspondingUpdate.value,
          });
        }
      }
    }

    console.log(`Updated ${updates.length} phone numbers in attribute data`);
  }
}
