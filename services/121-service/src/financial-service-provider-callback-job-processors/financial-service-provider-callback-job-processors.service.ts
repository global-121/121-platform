import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { SafaricomTimeoutCallbackJobDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-timeout-callback-job.dto';
import { SafaricomTransferCallbackJobDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-transfer-callback-job.dto';
import { SafaricomTransferScopedRepository } from '@121-service/src/payments/fsp-integration/safaricom/repositories/safaricom-transfer.scoped.repository';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Injectable()
export class FinancialServiceProviderCallbackJobProcessorsService {
  public constructor(
    private readonly safaricomTransferScopedRepository: SafaricomTransferScopedRepository,
    @Inject(getScopedRepositoryProviderName(TransactionEntity))
    private readonly transactionScopedRepository: ScopedRepository<TransactionEntity>,
  ) {}

  public async processSafaricomTransferCallbackJob(
    safaricomTransferCallbackJob: SafaricomTransferCallbackJobDto,
  ): Promise<void> {
    try {
      // Find the actual safaricom transfer by originatorConversationId
      const safaricomTransfer =
        await this.safaricomTransferScopedRepository.getByOriginatorConversationId(
          safaricomTransferCallbackJob.originatorConversationId,
        );

      // Prepare the transaction status based on resultCode from callback
      let updatedTransactionStatusAndErrorMessage = {};
      if (safaricomTransferCallbackJob.resultCode === 0) {
        updatedTransactionStatusAndErrorMessage = {
          status: TransactionStatusEnum.success,
        };
      } else {
        updatedTransactionStatusAndErrorMessage = {
          status: TransactionStatusEnum.error,
          errorMessage: `${safaricomTransferCallbackJob.resultCode} - ${safaricomTransferCallbackJob.resultDescription}`,
        };
      }

      // Update safaricom transfer with mpesaTransactionId
      await this.safaricomTransferScopedRepository.update(
        { id: safaricomTransfer.id },
        {
          mpesaTransactionId: safaricomTransferCallbackJob.mpesaTransactionId,
          mpesaConversationId: safaricomTransferCallbackJob.mpesaConversationId, // This should already be updated on initial request response, but just in case (e.g 121-service crash)
        },
      );

      // Update transaction status
      await this.transactionScopedRepository.update(
        { id: safaricomTransfer.transaction.id },
        updatedTransactionStatusAndErrorMessage,
      );
    } catch (error) {
      // This should never happen. This way, if it happens, we receive an alert
      if (error instanceof NotFoundException) {
        throw new InternalServerErrorException(error.message);
      }

      throw error;
    }
  }

  public async processSafaricomTimeoutCallbackJob(
    safaricomTimeoutCallbackJob: SafaricomTimeoutCallbackJobDto,
  ): Promise<void> {
    try {
      // Find the actual safaricom transfer by originatorConversationId
      const safaricomTransfer =
        await this.safaricomTransferScopedRepository.getByOriginatorConversationId(
          safaricomTimeoutCallbackJob.originatorConversationId,
        );

      // Update transaction status
      await this.transactionScopedRepository.update(
        { id: safaricomTransfer.transaction.id },
        {
          status: TransactionStatusEnum.error,
          errorMessage: 'Transfer timed out',
        },
      );
    } catch (error) {
      // This should never happen. This way, if it happens, we receive an alert
      if (error instanceof NotFoundException) {
        throw new InternalServerErrorException(error.message);
      }

      throw error;
    }
  }
}
