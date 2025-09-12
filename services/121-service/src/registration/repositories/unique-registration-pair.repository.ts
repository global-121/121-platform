import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UniqueRegistrationPairEntity } from '@121-service/src/registration/entities/unique-registration-pair.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

export class UniqueRegistrationPairRepository extends ScopedRepository<UniqueRegistrationPairEntity> {
  constructor(
    @Inject(REQUEST) request: ScopedUserRequest,
    @InjectRepository(UniqueRegistrationPairEntity)
    repository: Repository<UniqueRegistrationPairEntity>,
  ) {
    super(request, repository);
  }

  public async store({
    smallerRegistrationId: smallerRegistrationId,
    largerRegistrationId: largerRegistrationId,
  }: {
    smallerRegistrationId: number;
    largerRegistrationId: number;
  }): Promise<void> {
    const entity = this.create({
      smallerRegistrationId,
      largerRegistrationId,
    });
    await this.save(entity);
  }
}
