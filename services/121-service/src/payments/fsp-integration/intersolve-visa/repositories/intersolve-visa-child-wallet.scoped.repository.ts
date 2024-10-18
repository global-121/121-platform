import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';

import { IntersolveVisaChildWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-child-wallet.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

export class IntersolveVisaChildWalletScopedRepository extends ScopedRepository<IntersolveVisaChildWalletEntity> {
  constructor(
    @Inject(REQUEST) request: ScopedUserRequest,
    @InjectRepository(IntersolveVisaChildWalletEntity)
    scopedRepository: ScopedRepository<IntersolveVisaChildWalletEntity>,
  ) {
    super(request, scopedRepository);
  }
}
