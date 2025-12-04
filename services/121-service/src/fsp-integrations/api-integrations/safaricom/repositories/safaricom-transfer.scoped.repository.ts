import { Inject, NotFoundException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { SafaricomTransferEntity } from '@121-service/src/fsp-integrations/api-integrations/safaricom/entities/safaricom-transfer.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

export class SafaricomTransferScopedRepository extends ScopedRepository<SafaricomTransferEntity> {
  constructor(
    @Inject(REQUEST) request: ScopedUserRequest,
    @InjectRepository(SafaricomTransferEntity)
    repository: Repository<SafaricomTransferEntity>,
  ) {
    super(request, repository);
  }

  public async getByOriginatorConversationIdOrThrow(
    originatorConversationId: string,
  ): Promise<SafaricomTransferEntity> {
    const safaricomTransfer = await this.findOne({
      where: { originatorConversationId: Equal(originatorConversationId) },
    });

    if (!safaricomTransfer) {
      throw new NotFoundException(
        `Safaricom transfer with originatorConversationId ${originatorConversationId} not found`,
      );
    }

    return safaricomTransfer;
  }
}
