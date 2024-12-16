import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { NedbankVoucherEntity } from '@121-service/src/payments/fsp-integration/nedbank/nedbank-voucher.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

export class NedbankVoucherScopedRepository extends ScopedRepository<NedbankVoucherEntity> {
  constructor(
    @Inject(REQUEST) request: ScopedUserRequest,
    @InjectRepository(NedbankVoucherEntity)
    scopedRepository: Repository<NedbankVoucherEntity>,
  ) {
    super(request, scopedRepository);
  }
}
