import { Inject, NotFoundException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal } from 'typeorm';

import { SafaricomTransferEntity } from '@121-service/src/payments/fsp-integration/safaricom/entities/safaricom-transfer.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

export class SafaricomTransferScopedRepository extends ScopedRepository<SafaricomTransferEntity> {
  constructor(
    @Inject(REQUEST) request: ScopedUserRequest,
    @InjectRepository(SafaricomTransferEntity)
    scopedRepository: ScopedRepository<SafaricomTransferEntity>,
  ) {
    super(request, scopedRepository);
  }

  public async getByOriginatorConversationId(
    originatorConversationId: string,
  ): Promise<SafaricomTransferEntity> {
    const safaricomTransfer = await this.findOne({
      where: { originatorConversationId: Equal(originatorConversationId) },
      relations: ['transaction'],
    });

    if (!safaricomTransfer) {
      throw new NotFoundException(
        `Safaricom transfer with originatorConversationId ${originatorConversationId} not found`,
      );
    }

    return safaricomTransfer;
  }
}
