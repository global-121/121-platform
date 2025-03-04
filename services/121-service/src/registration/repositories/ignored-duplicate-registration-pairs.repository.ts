import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IgnoredDuplicateRegistrationPairEntity } from '@121-service/src/registration/registration-ignore-duplicate.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

export class IgnoredDuplicateRegistrationPairRepository extends ScopedRepository<IgnoredDuplicateRegistrationPairEntity> {
  constructor(
    @Inject(REQUEST) request: ScopedUserRequest,
    @InjectRepository(IgnoredDuplicateRegistrationPairEntity)
    repository: Repository<IgnoredDuplicateRegistrationPairEntity>,
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
