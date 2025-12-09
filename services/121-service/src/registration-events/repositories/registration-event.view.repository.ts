import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, Repository } from 'typeorm';

import { RegistrationEventSearchOptionsDto } from '@121-service/src/registration-events/dto/registration-event-search-options.dto';
import { RegistrationEventViewEntity } from '@121-service/src/registration-events/entities/registration-event.view.entity';
import { RegistrationEventEnum } from '@121-service/src/registration-events/enum/registration-event.enum';
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

  public createQueryBuilderExcludingStatusChanges(
    programId: number,
  ): ReturnType<Repository<RegistrationEventViewEntity>['createQueryBuilder']> {
    return this.createQueryBuilder('event')
      .andWhere('event.programId = :programId', {
        programId,
      })
      .andWhere('event."type" != :type', {
        type: RegistrationEventEnum.registrationStatusChange,
      });
  }

  public createQueryBuilderWithSearchOptions({
    searchOptions,
    programId,
  }: {
    searchOptions: RegistrationEventSearchOptionsDto;
    programId: number;
  }): ReturnType<
    Repository<RegistrationEventViewEntity>['createQueryBuilder']
  > {
    return this.createQueryBuilder('event').andWhere(
      this.createWhereClause(programId, searchOptions),
    );
  }

  private createWhereClause(
    programId: number,
    searchOptions: RegistrationEventSearchOptionsDto,
  ): FindOptionsWhere<RegistrationEventViewEntity> {
    const { registrationId, queryParams } = searchOptions;

    const whereStatement: FindOptionsWhere<RegistrationEventViewEntity> & {
      registration: {
        programId: number;
        id?: number;
        referenceId?: string;
      };
    } = {
      registration: {
        programId,
      },
    };

    if (registrationId) {
      whereStatement.registration.id = registrationId;
    }
    if (queryParams) {
      if (queryParams['referenceId']) {
        whereStatement.registration.referenceId = queryParams['referenceId'];
      }

      whereStatement.created = Between(
        queryParams['fromDate']
          ? new Date(queryParams['fromDate'])
          : new Date(2000, 1, 1),
        queryParams['toDate'] ? new Date(queryParams['toDate']) : new Date(),
      );
    }
    return whereStatement;
  }
}
