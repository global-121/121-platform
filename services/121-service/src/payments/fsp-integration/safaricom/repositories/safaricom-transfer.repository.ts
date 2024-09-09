import { SafaricomTransferEntity } from '@121-service/src/payments/fsp-integration/safaricom/entities/safaricom-transfer.entity';
import { DoTransferReturnType } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/do-transfer-return-type.interface';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

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

  public async createAndSaveSafaricomTransferData(
    safaricomDoTransferResult: DoTransferReturnType,
    transaction: TransactionEntity,
  ): Promise<any> {
    const safaricomTransferEntity = new SafaricomTransferEntity();

    safaricomTransferEntity.mpesaConversationId =
      safaricomDoTransferResult && safaricomDoTransferResult.conversationId
        ? safaricomDoTransferResult.conversationId
        : 'Invalid Request';
    safaricomTransferEntity.originatorConversationId =
      safaricomDoTransferResult &&
      safaricomDoTransferResult.originatorConversationId
        ? safaricomDoTransferResult.originatorConversationId
        : 'Invalid Request';

    safaricomTransferEntity.transactionId = transaction.id;

    await this.baseRepository.save(safaricomTransferEntity);
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
