import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  RegistrationEventViewEntity,
  STATUS_CHANGE_STRING,
} from '@121-service/src/registration-events/entities/registration-event.view.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

export class RegistrationEventViewScopedRepository extends ScopedRepository<RegistrationEventViewEntity> {
  constructor(
    @Inject(REQUEST) request: ScopedUserRequest,
    @InjectRepository(RegistrationEventViewEntity)
    repository: Repository<RegistrationEventViewEntity>,
  ) {
    super(request, repository);
  }

  public createQueryBuilderFilterByProgramId({
    programId,
  }: {
    programId: number;
  }): ReturnType<
    Repository<RegistrationEventViewEntity>['createQueryBuilder']
  > {
    return this.createQueryBuilder('event')
      .andWhere('event.programId = :programId', {
        programId,
      })
      .andWhere('event."fieldChanged" != :fieldChanged', {
        fieldChanged: STATUS_CHANGE_STRING,
      });
  }
}
