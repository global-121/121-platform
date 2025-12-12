import { Injectable } from '@nestjs/common';
import chunk from 'lodash/chunk';
import { DataSource, DeepPartial, Equal, In, Not } from 'typeorm';

import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationAttributeDataEntity } from '@121-service/src/registration/entities/registration-attribute-data.entity';
import { GenericRegistrationAttributes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { BaseSeedFactory } from '@121-service/src/scripts/factories/base-seed-factory';
import { RegistrationAttributeSeedFactory } from '@121-service/src/scripts/factories/registration-attribute-data-seed-factory';
import { RegistrationEventSeedFactory } from '@121-service/src/scripts/factories/registration-event-seed-factory';

@Injectable()
export class RegistrationSeedFactory extends BaseSeedFactory<RegistrationEntity> {
  private readonly attributeDataFactory: RegistrationAttributeSeedFactory;
  private readonly eventDataFactory: RegistrationEventSeedFactory;
  constructor(dataSource: DataSource) {
    super(dataSource, dataSource.getRepository(RegistrationEntity));
    this.attributeDataFactory = new RegistrationAttributeSeedFactory(
      dataSource,
    );
    this.eventDataFactory = new RegistrationEventSeedFactory(dataSource);
  }

  public async duplicateExistingRegistrationsForProgram({
    programId,
    includeRegistrationEvents = false,
  }: {
    programId: number;
    includeRegistrationEvents?: boolean;
  }): Promise<void> {
    // Get all existing registrations for the given program
    const existingRegistrations = await this.repository.find({
      where: { programId: Equal(programId) },
    });

    if (existingRegistrations.length === 0) {
      console.warn(
        `No existing registrations found to duplicate for programId ${programId}`,
      );
      return;
    }

    // Get current max registrationProgramId for this program
    const maxResult = await this.repository
      .createQueryBuilder('registration')
      .select('MAX(registration.registrationProgramId)', 'max')
      .where('registration.programId = :programId', { programId })
      .getRawOne();
    let currentMax = maxResult?.max || 0;

    const newRegistrationsData: DeepPartial<RegistrationEntity>[] =
      existingRegistrations.map((registration) => {
        currentMax += 1;
        return {
          programId: registration.programId,
          registrationStatus: registration.registrationStatus,
          referenceId: this.generateUniqueReferenceId(),
          phoneNumber: `254${programId}${currentMax.toString().padStart(8, '0')}`, // Ensure unique phone number
          preferredLanguage: registration.preferredLanguage,
          inclusionScore: registration.inclusionScore,
          paymentAmountMultiplier: registration.paymentAmountMultiplier,
          registrationProgramId: currentMax,
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

    const newRegistrationIds =
      await this.insertEntitiesBatch(newRegistrationsData);

    await this.attributeDataFactory.duplicateAttributeDataForRegistrations(
      newRegistrationIds,
      programId,
    );
    if (includeRegistrationEvents) {
      await this.eventDataFactory.duplicateRegistrationEvents(
        newRegistrationIds,
        programId,
        this.repository,
      );
    }
  }

  public async makePhoneNumbersUnique(): Promise<void> {
    console.log('Updating phone numbers in registration attribute data');

    const attributeDataRepository = this.dataSource.getRepository(
      RegistrationAttributeDataEntity,
    );

    // Find phone number attributes
    const phoneAttributeRecords = await attributeDataRepository
      .createQueryBuilder('rad')
      .select('rad.id AS id')
      .innerJoin('rad.programRegistrationAttribute', 'pra')
      .leftJoin('rad.registration', 'r')
      .addSelect('pra.name AS "attributeName"')
      .addSelect('r.phoneNumber AS "phoneNumber"')
      .where('pra.name IN (:...phoneNames)', {
        phoneNames: ['phoneNumber', 'whatsappPhoneNumber'],
      })
      .getRawMany();

    // Update each phone attribute with a new unique number
    const dataToUpdate: { id: number; value: string }[] = [];
    for (const record of phoneAttributeRecords) {
      let newPhoneNumber = '';
      if (record.attributeName === GenericRegistrationAttributes.phoneNumber) {
        newPhoneNumber = record.phoneNumber!;
      } else {
        newPhoneNumber = this.generatePhoneNumber();
      }
      dataToUpdate.push({
        id: record.id,
        value: newPhoneNumber,
      });
    }

    // Update in batches
    const batchSize = 100;
    for (const batch of chunk(dataToUpdate, batchSize)) {
      await Promise.all(
        batch.map(({ id, value }) =>
          attributeDataRepository.update(id, { value }),
        ),
      );
    }

    console.log(
      `Updated ${dataToUpdate.length} phone numbers in attribute data`,
    );
  }

  public async makeAttributesWithDuplicateCheckUnique(): Promise<void> {
    console.log(
      'Updating attributes with duplicateCheck=true in registration attribute data',
    );

    const attributeDataRepository = this.dataSource.getRepository(
      RegistrationAttributeDataEntity,
    );
    const programRegistrationAttributeRepository =
      this.dataSource.getRepository(ProgramRegistrationAttributeEntity);

    // Find all program registration attributes with duplicateCheck=true
    const attributesWithDuplicateCheck =
      await programRegistrationAttributeRepository.find({
        where: {
          duplicateCheck: Equal(true),
          name: Not(In(['phoneNumber', 'whatsappPhoneNumber'])),
        },
      });
    if (attributesWithDuplicateCheck.length === 0) {
      console.log('No attributes found with duplicateCheck=true');
      return;
    }
    const attributeIds = attributesWithDuplicateCheck.map((attr) => attr.id);

    // Find all attribute data records for those attributes
    const attributeDataRecords = await attributeDataRepository
      .createQueryBuilder('rad')
      .select('rad.id AS id')
      .innerJoin('rad.programRegistrationAttribute', 'pra')
      .leftJoin('rad.registration', 'r')
      .addSelect('pra.name AS "attributeName"')
      .addSelect('rad.value AS "value"')
      .where('rad.programRegistrationAttributeId IN (:...attributeIds)', {
        attributeIds,
      })
      .getRawMany();

    // Update each attribute with a new unique value
    const dataToUpdate: { id: number; value: string }[] = [];
    for (const record of attributeDataRecords) {
      const newValue = this.generateUniqueReferenceId();
      dataToUpdate.push({
        id: record.id,
        value: newValue,
      });
    }

    // Update in batches
    const batchSize = 100;
    for (const batch of chunk(dataToUpdate, batchSize)) {
      await Promise.all(
        batch.map(({ id, value }) =>
          attributeDataRepository.update(id, { value }),
        ),
      );
    }

    console.log(
      `Updated ${dataToUpdate.length} attributes with duplicateCheck=true in attribute data`,
    );
  }

  private generateUniqueReferenceId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private generatePhoneNumber(): string {
    return `254${Math.floor(Math.random() * 900000000) + 100000000}`;
  }
}
