import { Inject, NotFoundException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { OnafriqTransactionEntity } from '@121-service/src/payments/fsp-integration/onafriq/entities/onafriq-transaction.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

export class OnafriqTransactionScopedRepository extends ScopedRepository<OnafriqTransactionEntity> {
  constructor(
    @Inject(REQUEST) request: ScopedUserRequest,
    @InjectRepository(OnafriqTransactionEntity)
    repository: Repository<OnafriqTransactionEntity>,
  ) {
    super(request, repository);
  }

  public async getByThirdPartyTransId(
    thirdPartyTransId: string,
  ): Promise<OnafriqTransactionEntity> {
    const onafriqTransaction = await this.findOne({
      where: { thirdPartyTransId: Equal(thirdPartyTransId) },
      relations: ['transaction'],
    });

    if (!onafriqTransaction) {
      throw new NotFoundException(
        `Onafriq transaction with thirdPartyTransId ${thirdPartyTransId} not found`,
      );
    }

    return onafriqTransaction;
  }
}
