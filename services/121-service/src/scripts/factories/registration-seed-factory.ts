import { Injectable } from '@nestjs/common';
import chunk from 'lodash/chunk';
import { DataSource, DeepPartial, Equal } from 'typeorm';

import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationAttributeDataEntity } from '@121-service/src/registration/entities/registration-attribute-data.entity';
import { BaseSeedFactory } from '@121-service/src/scripts/factories/base-seed-factory';
import { RegistrationAttributeSeedFactory } from '@121-service/src/scripts/factories/registration-attribute-data-seed-factory';

@Injectable()
export class RegistrationSeedFactory extends BaseSeedFactory<RegistrationEntity> {
  private readonly attributeDataFactory: RegistrationAttributeSeedFactory;
  constructor(dataSource: DataSource) {
    super(dataSource, dataSource.getRepository(RegistrationEntity));
    this.attributeDataFactory = new RegistrationAttributeSeedFactory(
      dataSource,
    );
  }

  public async duplicateExistingRegistrationsForProgram(
    programId: number,
  ): Promise<void> {
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
          phoneNumber: `+254${programId}0000${currentMax.toString().padStart(6, '0')}`, // Ensure unique phone number
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
    );
  }

  public async makePhoneNumbersUnique(): Promise<void> {
    console.log('Updating phone numbers in registration attribute data');

    const attributeDataRepository = this.dataSource.getRepository(
      RegistrationAttributeDataEntity,
    );

    // Find phone number attributes
    const phoneAttributes = await attributeDataRepository
      .createQueryBuilder('rad')
      .innerJoin('rad.programRegistrationAttribute', 'pra')
      .leftJoin('rad.registration', 'r')
      .addSelect('r.phoneNumber AS "phoneNumber"')
      .where('pra.name IN (:...phoneNames)', {
        phoneNames: ['phoneNumber', 'whatsappPhoneNumber'],
      })
      .getMany();

    // Update each phone attribute with a new unique number
    const updates: { id: number; value: string }[] = [];
    for (const attribute of phoneAttributes) {
      let newPhoneNumber = '';
      if (attribute.programRegistrationAttribute?.name === 'phoneNumber') {
        newPhoneNumber = attribute.registration.phoneNumber!;
      } else {
        newPhoneNumber = this.generatePhoneNumber();
      }
      updates.push({
        id: attribute.id,
        value: newPhoneNumber,
      });
    }

    // Update in batches
    const batchSize = 100;
    for (const batch of chunk(phoneAttributes, batchSize)) {
      await Promise.all(
        batch.map(({ id, value }) =>
          attributeDataRepository.update(id, { value }),
        ),
      );
    }

    console.log(`Updated ${updates.length} phone numbers in attribute data`);
  }

  private generateUniqueReferenceId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private generatePhoneNumber(): string {
    return `+254${Math.floor(Math.random() * 900000000) + 100000000}`;
  }
}
