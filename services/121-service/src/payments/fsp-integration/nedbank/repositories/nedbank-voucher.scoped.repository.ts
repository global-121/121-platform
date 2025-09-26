import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { NedbankVoucherEntity } from '@121-service/src/payments/fsp-integration/nedbank/entities/nedbank-voucher.entity';
import { NedbankVoucherStatus } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-voucher-status.enum';
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

  public async upsertVoucherByTransactionId({
    paymentReference,
    orderCreateReference,
    transactionId,
    voucherStatus,
  }: {
    paymentReference: string;
    orderCreateReference: string;
    transactionId: number;
    voucherStatus?: NedbankVoucherStatus;
  }): Promise<void> {
    const existingVoucher = await this.findOne({
      where: { transactionId: Equal(transactionId) },
    });

    if (existingVoucher) {
      existingVoucher.paymentReference = paymentReference;
      existingVoucher.orderCreateReference = orderCreateReference;
      existingVoucher.status = voucherStatus;
      await this.save(existingVoucher);
    } else {
      const nedbankVoucherEntity = this.create({
        paymentReference,
        orderCreateReference,
        status: voucherStatus,
        transactionId,
      });
      await this.save(nedbankVoucherEntity);
    }
  }

  public async getVoucherWhereStatusNull({
    transactionId,
  }: {
    transactionId: number;
  }): Promise<NedbankVoucherEntity | null> {
    return await this.createQueryBuilder('nedbankVoucher')
      .leftJoin('nedbankVoucher.transaction', 'transaction')
      .andWhere('transaction."id" = :transactionId', {
        transactionId,
      })
      .andWhere('nedbankVoucher.status IS NULL')
      .getOne();
  }
}
