import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IntersolveVisaParentWalletEntity } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/entities/intersolve-visa-parent-wallet.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

export class IntersolveVisaParentWalletScopedRepository extends ScopedRepository<IntersolveVisaParentWalletEntity> {
  constructor(
    @Inject(REQUEST) request: ScopedUserRequest,
    @InjectRepository(IntersolveVisaParentWalletEntity)
    repository: Repository<IntersolveVisaParentWalletEntity>,
  ) {
    super(request, repository);
  }
}
