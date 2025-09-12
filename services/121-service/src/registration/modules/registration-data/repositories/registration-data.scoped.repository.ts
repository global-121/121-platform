import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { SelectQueryBuilder } from 'typeorm';
import { Repository } from 'typeorm';

import { RegistrationDataByNameDto } from '@121-service/src/registration/dto/registration-data-by-name.dto';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationAttributeDataEntity } from '@121-service/src/registration/entities/registration-attribute-data.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

export class RegistrationDataScopedRepository extends ScopedRepository<RegistrationAttributeDataEntity> {
  constructor(
    @Inject(REQUEST) request: ScopedUserRequest,
    @InjectRepository(RegistrationAttributeDataEntity)
    repository: Repository<RegistrationAttributeDataEntity>,
  ) {
    super(request, repository);
  }

  public async getRegistrationDataArrayByName(
    registration: RegistrationEntity,
    names: string[],
  ): Promise<RegistrationDataByNameDto[] | null> {
    const query = this.getRegistrationDataArrayQuery(registration, names);
    const queryWithSelect = query.select(
      ` "programRegistrationAttribute"."name" as name,
        value, "registrationData".id`,
    );
    const result = await queryWithSelect.getRawMany();
    return result;
  }

  private getRegistrationDataArrayQuery(
    registration: RegistrationEntity,
    names: string[],
  ): SelectQueryBuilder<RegistrationAttributeDataEntity> {
    return this.createQueryBuilder('registrationData')
      .leftJoin('registrationData.registration', 'registration')
      .leftJoin(
        'registrationData.programRegistrationAttribute',
        'programRegistrationAttribute',
      )
      .andWhere('registration.id = :id', { id: registration.id })
      .andWhere(`programRegistrationAttribute.name IN (:...names)`, { names });
  }
}
