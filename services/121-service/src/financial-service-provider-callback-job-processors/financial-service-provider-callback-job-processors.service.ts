import { SafaricomTransferCallbackJobDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-transfer-callback-job.dto';
import { SafaricomTransferTimeoutCallbackJobDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-transfer-timeout-callback-job.dto';
import { SafaricomTransferRepository } from '@121-service/src/payments/fsp-integration/safaricom/repositories/safaricom-transfer.repository';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class FinancialServiceProviderCallbackJobProcessorsService {
  public constructor(
    private readonly safaricomTransferRepository: SafaricomTransferRepository,
    @Inject(getScopedRepositoryProviderName(TransactionEntity))
    private readonly transactionScopedRepository: ScopedRepository<TransactionEntity>,
  ) {}

  public async processSafaricomTransferCallbackJob(
    safaricomTransferCallbackJob: SafaricomTransferCallbackJobDto,
  ): Promise<void> {
    // Find the actual safaricom transfer by originatorConversationId
    const safaricomTransfer =
      await this.safaricomTransferRepository.getSafaricomTransferByOriginatorConversationId(
        safaricomTransferCallbackJob.originatorConversationId,
      );

    // Prepare the transaction status based on resultCode from callback
    let updatedTransactionStatus = {};
    if (safaricomTransferCallbackJob.resultCode === 0) {
      updatedTransactionStatus = {
        status: TransactionStatusEnum.success,
      };
    } else {
      updatedTransactionStatus = {
        status: TransactionStatusEnum.error,
        errorMessage: safaricomTransferCallbackJob.resultDescription,
      };
    }

    // Update safaricom transfer with mpesaTransactionId
    await this.safaricomTransferRepository.update(
      { id: safaricomTransfer.id },
      {
        mpesaTransactionId: safaricomTransferCallbackJob.mpesaTransactionId,
      },
    );

    // Update transaction status
    await this.transactionScopedRepository.update(
      { id: safaricomTransfer.transaction.id },
      updatedTransactionStatus,
    );
  }

  public async processSafaricomTimeoutCallbackJob(
    safaricomTransferTimeoutCallbackJob: SafaricomTransferTimeoutCallbackJobDto,
  ): Promise<void> {
    // Find the actual safaricom transfer by originatorConversationId
    const safaricomTransfer =
      await this.safaricomTransferRepository.getSafaricomTransferByOriginatorConversationId(
        safaricomTransferTimeoutCallbackJob.originatorConversationId,
      );

    // Update transaction status
    await this.transactionScopedRepository.update(
      { id: safaricomTransfer.transaction.id },
      {
        status: TransactionStatusEnum.error,
        errorMessage: 'Transfer timed out',
      },
    );
  }
}
