import { RegistrationDataByNameDto } from '@121-service/src/registration/dto/registration-data-by-name.dto';
import { RegistrationDataEntity } from '@121-service/src/registration/registration-data.entity';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';
import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Brackets, SelectQueryBuilder } from 'typeorm';

export class RegistrationDataScopedRepository extends ScopedRepository<RegistrationDataEntity> {
  constructor(
    @Inject(REQUEST) request: ScopedUserRequest,
    @Inject(getScopedRepositoryProviderName(RegistrationDataEntity))
    scopedRepository: ScopedRepository<RegistrationDataEntity>,
  ) {
    super(request, scopedRepository);
  }

  public async getRegistrationDataArrayByName(
    registration: RegistrationEntity,
    names: string[],
  ): Promise<RegistrationDataByNameDto[] | null> {
    const query = this.getRegistrationDataArrayQuery(registration, names);
    const queryWithSelect = query.select(
      `CASE
          WHEN ("programQuestion"."name" is not NULL) THEN "programQuestion"."name"
          WHEN ("fspQuestion"."name" is not NULL) THEN "fspQuestion"."name"
          WHEN ("programCustomAttribute"."name" is not NULL) THEN "programCustomAttribute"."name"
        END as name,
        value, "registrationData".id`,
    );
    const result = await queryWithSelect.getRawMany();
    return result;
  }

  private getRegistrationDataArrayQuery(
    registration: RegistrationEntity,
    names: string[],
  ): SelectQueryBuilder<RegistrationDataEntity> {
    return this.createQueryBuilder('registrationData')
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
          qb.andWhere(`programQuestion.name IN (:...names)`, { names: names })
            .orWhere(
              `(fspQuestion.name IN (:...names) AND "fspQuestion"."fspId" = :fsp)`,
              {
                names: names,
                fsp: registration.fspId,
              },
            )
            .orWhere(`programCustomAttribute.name IN (:...names)`, {
              names: names,
            });
        }),
      );
  }
}
