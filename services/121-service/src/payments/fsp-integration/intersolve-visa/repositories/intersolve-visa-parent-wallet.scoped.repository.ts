import { IntersolveVisaParentWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-parent-wallet.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';

export class IntersolveVisaParentWalletScopedRepository extends ScopedRepository<IntersolveVisaParentWalletEntity> {
  constructor(
    @Inject(REQUEST) request: ScopedUserRequest,
    @InjectRepository(IntersolveVisaParentWalletEntity)
    scopedRepository: ScopedRepository<IntersolveVisaParentWalletEntity>,
  ) {
    super(request, scopedRepository);
  }
}
