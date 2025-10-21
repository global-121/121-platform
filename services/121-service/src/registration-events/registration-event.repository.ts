import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, Repository } from 'typeorm';

import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationEventSearchOptionsDto } from '@121-service/src/registration-events/dto/registration-event-search-options.dto';
import { RegistrationEventEntity } from '@121-service/src/registration-events/entities/registration-event.entity';
import { RegistrationEventAttributeEntity } from '@121-service/src/registration-events/entities/registration-event-attribute.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { UserEntity } from '@121-service/src/user/entities/user.entity';

export class RegistrationEventScopedRepository extends ScopedRepository<RegistrationEventEntity> {
  constructor(
    @Inject(REQUEST) request: ScopedUserRequest,
    @InjectRepository(RegistrationEventEntity)
    repository: Repository<RegistrationEventEntity>,
  ) {
    super(request, repository);
  }

  async getManyByProgramIdAndSearchOptions(
    programId: number,
    searchOptions: RegistrationEventSearchOptionsDto,
  ) {
    const exportLimit = 500000;
    const events: (RegistrationEventEntity & {
      registration: RegistrationEntity;
      user: UserEntity;
      attributes: RegistrationEventAttributeEntity[];
    })[] = await this.find({
      where: this.createWhereClause(programId, searchOptions),
      relations: ['registration', 'user', 'attributes'],
      order: { created: 'DESC' },
      take: exportLimit,
    });
    return events;
  }

  private createWhereClause(
    programId: number,
    searchOptions: RegistrationEventSearchOptionsDto,
  ): FindOptionsWhere<RegistrationEventEntity> {
    const { registrationId, queryParams } = searchOptions;

    const whereStatement: FindOptionsWhere<RegistrationEventEntity> & {
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
      if ((queryParams as any)['referenceId']) {
        whereStatement.registration.referenceId = (queryParams as any)['referenceId'];
      }

      whereStatement.created = Between(
        (queryParams as any)['fromDate']
          ? new Date((queryParams as any)['fromDate'])
          : new Date(2000, 1, 1),
        (queryParams as any)['toDate'] ? new Date((queryParams as any)['toDate']) : new Date(),
      );
    }
    return whereStatement;
  }
}
