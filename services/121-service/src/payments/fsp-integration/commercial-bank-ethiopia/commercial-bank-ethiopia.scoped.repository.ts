import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CbeTransferEntity } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia-transfer.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

export class CbeTransferScopedRepository extends ScopedRepository<CbeTransferEntity> {
  constructor(
    @Inject(REQUEST) request: ScopedUserRequest,
    @InjectRepository(CbeTransferEntity)
    repository: Repository<CbeTransferEntity>,
  ) {
    super(request, repository);
  }

  public async getExistingCbeTransferOrFail(
    paymentId: number,
    registrationId: number,
  ): Promise<CbeTransferEntity> {
    const existingCbeTransfer = await this.createQueryBuilder('cbeTransfer')
      .leftJoinAndSelect('cbeTransfer.transaction', 'transaction')
      .andWhere('transaction.paymentId = :paymentId', {
        paymentId,
      })
      .andWhere('transaction.registrationId = :registrationId', {
        registrationId,
      })
      .orderBy('transaction.created', 'DESC')
      .getOne();

    if (!existingCbeTransfer) {
      throw new Error(
        `No existing CBE transfer found for paymentId ${paymentId} and registrationId ${registrationId} while processing retry.`,
      );
    }
    return existingCbeTransfer;
  }
}
