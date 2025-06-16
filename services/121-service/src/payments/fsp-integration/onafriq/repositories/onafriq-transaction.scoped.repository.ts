import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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

  // ##TODO: check if anything is needed here. Probably on reconciliation.
  // public async getByOriginatorConversationId(
  //   originatorConversationId: string,
  // ): Promise<OnafriqTransactionEntity> {
  //   const onafriqTransfer = await this.findOne({
  //     where: { originatorConversationId: Equal(originatorConversationId) },
  //     relations: ['transaction'],
  //   });

  //   if (!onafriqTransfer) {
  //     throw new NotFoundException(
  //       `Onafriq transfer with originatorConversationId ${originatorConversationId} not found`,
  //     );
  //   }

  //   return onafriqTransfer;
  // }
}
