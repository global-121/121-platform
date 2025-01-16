import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { NedbankVoucherStatus } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-voucher-status.enum';
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

  public async storeVoucher({
    // Should this function live in the repository only?
    orderCreateReference,
    voucherStatus,
    transactionId,
  }: {
    orderCreateReference: string;
    voucherStatus: NedbankVoucherStatus;
    transactionId: number;
  }): Promise<void> {
    const nedbankVoucherEntity = this.create({
      orderCreateReference,
      status: voucherStatus,
      transactionId,
    });
    await this.save(nedbankVoucherEntity);
  }
}
