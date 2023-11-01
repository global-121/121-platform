import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { DataSource } from 'typeorm';
import { ScopedRepository } from '../scoped.repository';
import { RegistrationEntity } from './registration.entity';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class RegistrationRepository extends ScopedRepository<RegistrationEntity> {
  constructor(
    dataSource: DataSource,
    // TODO check if this can be set on ScopedRepository so it can be reused
    @Inject(REQUEST) public request: Request,
  ) {
    super(RegistrationEntity, dataSource);
  }
}
