import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

import { env } from '@121-service/src/env';
import { CooperativeBankOfOromiaTransferResultEnum } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/enums/cooperative-bank-of-oromia-disbursement-result.enum';
import { CooperativeBankOfOromiaError } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/errors/cooperative-bank-of-oromia.error';
import { CooperativeBankOfOromiaService } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/services/cooperative-bank-of-oromia.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventCreationContext } from '@121-service/src/payments/transactions/transaction-events/interfaces/transaction-event-creation-context.interfac';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';
import { CooperativeBankOfOromiaTransactionJobDto } from '@121-service/src/transaction-queues/dto/cooperative-bank-of-oromia-transaction-job.dto';

@Injectable()
export class TransactionJobsCooperativeBankOfOromiaService {
  constructor(
    private readonly cooperativeBankOfOromiaService: CooperativeBankOfOromiaService,
    private readonly transactionJobsHelperService: TransactionJobsHelperService,
    private readonly transactionEventScopedRepository: TransactionEventsScopedRepository,
    private readonly transactionsService: TransactionsService,
  ) {}

  public async processCooperativeBankOfOromiaTransactionJob(
    transactionJob: CooperativeBankOfOromiaTransactionJobDto,
  ): Promise<void> {
    if (!env.COOPERATIVE_BANK_OF_OROMIA_ENABLED) {
      console.error(
        'CooperativeBankOfOromia FSP is not enabled, not processing transaction jobs.',
      );
    }

    const transactionEventContext: TransactionEventCreationContext = {
      transactionId: transactionJob.transactionId,
      userId: transactionJob.userId,
      programFspConfigurationId: transactionJob.programFspConfigurationId,
    };
    await this.transactionJobsHelperService.createInitiatedOrRetryTransactionEvent(
      {
        context: transactionEventContext,
        isRetry: transactionJob.isRetry,
      },
    );

    // Inner function.
    const handleTransferResult = async (
      status: TransactionStatusEnum,
      errorText?: string,
    ) => {
      await this.transactionsService.saveTransactionProgress({
        context: transactionEventContext,
        newTransactionStatus: status,
        errorMessage: errorText,
        description: TransactionEventDescription.airtelRequestSent,
      });
    };

    // 1. Prepare.
    const failedTransactionAttempts =
      await this.transactionEventScopedRepository.countFailedTransactionAttempts(
        transactionJob.transactionId,
      );

    const cooperativeBankOfOromiaTransactionId = this.generateTransactionId({
      referenceId: transactionJob.referenceId,
      transactionId: transactionJob.transactionId,
      failedTransactionAttempts,
    });

    // 2. Initiate transfer
    try {
      await this.cooperativeBankOfOromiaService.initiateTransfer({
        cooperativeBankOfOromiaTransactionId,
        phoneNumber: transactionJob.phoneNumber,
        amount: transactionJob.transferValue,
      });
    } catch (error) {
      // We only want to write a specific set of errors to transactions, outside
      // of this set: rethrow.
      if (!(error instanceof CooperativeBankOfOromiaError)) {
        throw error;
      }

      await handleTransferResult(
        TransactionStatusEnum.error,
        error?.message,
      );
      return; // Don't continue processing the job.
    }

    // 3. Handle success response.
    return await handleTransferResult(TransactionStatusEnum.success);
  }

  private generateTransactionId = ({
    referenceId,
    transactionId,
    failedTransactionAttempts,
  }: {
    referenceId: string;
    transactionId: number;
    failedTransactionAttempts: number;
  }): string => {
    // We need a transactionId that's unique for the combination of:
    // - referenceId
    // - 121 transactionId
    // - failedTransactionAttempts (to ensure that each retry gets a different transactionId)

    const toHash = `ReferenceId=${referenceId},TransactionId=${transactionId},Attempt=${failedTransactionAttempts}`;
    
    // This is deterministic.
    const transactionIdHash = crypto
      .createHash('sha256') // Always 64 chars
      .update(toHash, 'utf8')
      .digest('hex');

    return transactionIdHash;
  };
}
