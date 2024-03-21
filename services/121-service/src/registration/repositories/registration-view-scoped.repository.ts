import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { ScopedUserRequest } from '../../shared/scoped-user-request';
import { RegistrationViewEntity } from '../registration-view.entity';
import { RegistrationScopedBaseRepository } from './registration-scoped-base.repository';

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
