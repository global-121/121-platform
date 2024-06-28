import { RegistrationDataEntity } from '@121-service/src/registration/registration-data.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets } from 'typeorm';

export class RegistrationDataScopedRepository extends ScopedRepository<RegistrationDataEntity> {
  constructor(
    @Inject(REQUEST) request: ScopedUserRequest,
    @InjectRepository(RegistrationDataEntity)
    scopedRepository: ScopedRepository<RegistrationDataEntity>,
  ) {
    super(request, scopedRepository);
  }

  public async getRegistrationsWithData(
    referenceIds: string[],
    dataFieldNames: string[],
  ) {
    if (referenceIds.length === 0) {
      throw new Error('No referenceIds provided');
    }
    if (dataFieldNames.length === 0) {
      throw new Error('No dataFieldNames provided');
    }

    return await this.createQueryBuilder('registrationData')
      .innerJoin('registrationData.registration', 'registration')
      .leftJoin('registrationData.programQuestion', 'programQuestion')
      .leftJoinAndSelect(
        'registrationData.fspQuestion',
        'fspQuestion',
        'fspQuestion.id = registrationData.fspQuestionId and fspQuestion.fspId = registration.fspId',
      )
      .leftJoin(
        'registrationData.programCustomAttribute',
        'programCustomAttribute',
      )
      .andWhere('registration.referenceId = ANY(:ids)', { ids: referenceIds })
      .andWhere(
        new Brackets((qb) => {
          qb.andWhere(`programQuestion.name IN (:...names)`, {
            names: dataFieldNames,
          })
            .orWhere(`(fspQuestion.name IN (:...names)`, {
              names: dataFieldNames,
            })
            .orWhere(`programCustomAttribute.name IN (:...names`, {
              names: dataFieldNames,
            });
        }),
      )
      .getRawMany();
  }

  private async getRegistrationDataByName(
    registration: RegistrationEntity,
    name: string,
  ): Promise<RegistrationDataByNameDto | null> {
    const query = this.getRegistrationDataQuery(registration, name);
    const queryWithSelect = query.select(
      `CASE
          WHEN ("programQuestion"."name" is not NULL) THEN "programQuestion"."name"
          WHEN ("fspQuestion"."name" is not NULL) THEN "fspQuestion"."name"
          WHEN ("programCustomAttribute"."name" is not NULL) THEN "programCustomAttribute"."name"
        END as name,
        value, "registrationData".id`,
    );
    const result = queryWithSelect.getRawOne();
    return result;
  }

  private getRegistrationDataQuery(
    registration: RegistrationEntity,
    name: string,
  ): SelectQueryBuilder<RegistrationDataEntity> {
    return this.registrationDataScopedRepository
      .createQueryBuilder('registrationData')
      .leftJoin('registrationData.registration', 'registration')
      .leftJoin('registrationData.programQuestion', 'programQuestion')
      .leftJoin('registrationData.fspQuestion', 'fspQuestion')
      .leftJoin(
        'registrationData.programCustomAttribute',
        'programCustomAttribute',
      )
      .andWhere('registration.id = :id', { id: registration.id })
      .andWhere(
        new Brackets((qb) => {
          qb.andWhere(`programQuestion.name = :name`, { name: name })
            .orWhere(
              `(fspQuestion.name = :name AND "fspQuestion"."fspId" = :fsp)`,
              {
                name: name,
                fsp: registration.fspId,
              },
            )
            .orWhere(`programCustomAttribute.name = :name`, {
              name: name,
            });
        }),
      );
  }
}
