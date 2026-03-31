import { Injectable } from '@nestjs/common';

import { MtnApiError } from '@121-service/src/fsp-integrations/integrations/mtn/errors/mtn-api.error';
import { MtnService } from '@121-service/src/fsp-integrations/integrations/mtn/mtn.service';
import { TransactionJobsHelperService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-helper.service';
import { MtnTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/mtn-transaction-job.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventCreationContext } from '@121-service/src/payments/transactions/transaction-events/interfaces/transaction-event-creation-context.interfac';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';

@Injectable()
export class TransactionJobsMtnService {
  constructor(
    private readonly mtnService: MtnService,
    private readonly transactionJobsHelperService: TransactionJobsHelperService,
    private readonly transactionsService: TransactionsService,
  ) {}

  public async processMtnTransactionJob(
    transactionJob: MtnTransactionJobDto,
  ): Promise<void> {
    // 1. Log transaction-job start: create 'initiated'/'retry' transaction event, set transaction to 'waiting' and update registration (if 'initiated')
    const transactionEventContext: TransactionEventCreationContext = {
      transactionId: transactionJob.transactionId,
      userId: transactionJob.userId,
      programFspConfigurationId: transactionJob.programFspConfigurationId,
    };
    await this.transactionJobsHelperService.logTransactionJobStart({
      context: transactionEventContext,
      isRetry: transactionJob.isRetry,
    });

    // 2. Start the transfer
    try {
      await this.mtnService.createTransfer({
        amount: String(transactionJob.transferValue),
        currency: 'EUR', // TODO: make this dynamic based on program configuration
        externalId: transactionJob.referenceId,
        payee: {
          partyIdType: 'MSISDN',
          partyId: transactionJob.phoneNumber,
        },
        payerMessage: `Payment for transaction ${transactionJob.transactionId}`,
        payeeNote: `Payment for transaction ${transactionJob.transactionId}`,
      });
    } catch (error) {
      if (error instanceof MtnApiError) {
        await this.transactionsService.saveProgress({
          context: transactionEventContext,
          description: TransactionEventDescription.mtnRequestSent,
          errorMessage: error.message,
          newTransactionStatus: TransactionStatusEnum.error,
        });
        return;
      }
      throw error;
    }

    // 3. Store success transaction event
    await this.transactionsService.saveProgress({
      context: transactionEventContext,
      description: TransactionEventDescription.mtnRequestSent,
      newTransactionStatus: TransactionStatusEnum.success,
    });
  }
}
