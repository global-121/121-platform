import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { DataSource } from 'typeorm';
import { ScopedRepository } from '../../../scoped.repository';
import { IntersolveVisaWalletEntity } from './intersolve-visa-wallet.entity';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class IntersolveVisaWalletScopedRepository extends ScopedRepository<IntersolveVisaWalletEntity> {
  constructor(
    dataSource: DataSource,
    // TODO check if this can be set on ScopedRepository so it can be reused
    @Inject(REQUEST) public request: Request,
  ) {
    super(IntersolveVisaWalletEntity, dataSource, [
      'intersolveVisaCustomer',
      'registration',
    ]);
  }
}
