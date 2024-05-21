import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { RegistrationScopedBaseRepository } from '@121-service/src/registration/repositories/registration-scoped-base.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { DataSource } from 'typeorm';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class RegistrationViewScopedRepository extends RegistrationScopedBaseRepository<RegistrationViewEntity> {
  constructor(
    dataSource: DataSource,
    // TODO check if this can be set on ScopedRepository so it can be reused
    @Inject(REQUEST) public request: ScopedUserRequest,
  ) {
    super(RegistrationViewEntity, dataSource);
  }
}
