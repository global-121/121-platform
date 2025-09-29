import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

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

  public async getExistingCbeTransferOrFail({
    transactionId,
  }: {
    transactionId: number;
  }): Promise<CbeTransferEntity> {
    const existingCbeTransfer = await this.findOne({
      where: {
        transactionId: Equal(transactionId),
      },
      order: {
        created: 'DESC',
      },
    });

    if (!existingCbeTransfer) {
      throw new Error(
        `No existing CBE transfer found for transactionId ${transactionId} while processing retry.`,
      );
    }
    return existingCbeTransfer;
  }
}
