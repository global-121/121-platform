import { NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { SafaricomTransferEntity } from '@121-service/src/payments/fsp-integration/safaricom/entities/safaricom-transfer.entity';

export class SafaricomTransferRepository extends Repository<SafaricomTransferEntity> {
  constructor(
    @InjectRepository(SafaricomTransferEntity)
    private baseRepository: Repository<SafaricomTransferEntity>,
  ) {
    super(
      baseRepository.target,
      baseRepository.manager,
      baseRepository.queryRunner,
    );
  }

  public async getSafaricomTransferByOriginatorConversationId(
    originatorConversationId: string,
  ): Promise<SafaricomTransferEntity> {
    const safaricomTransfer = await this.baseRepository.findOne({
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
