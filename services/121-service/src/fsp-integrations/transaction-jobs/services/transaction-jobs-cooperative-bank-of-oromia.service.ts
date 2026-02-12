import { Injectable } from '@nestjs/common';
import crypto from 'node:crypto';

import { CooperativeBankOfOromiaTransferResultEnum } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/enums/cooperative-bank-of-oromia-disbursement-result.enum';
import { CooperativeBankOfOromiaError } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/errors/cooperative-bank-of-oromia.error';
import { CooperativeBankOfOromiaService } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/services/cooperative-bank-of-oromia.service';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { TransactionJobsHelperService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-helper.service';
import { CooperativeBankOfOromiaTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/cooperative-bank-of-oromia-transaction-job.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventCreationContext } from '@121-service/src/payments/transactions/transaction-events/interfaces/transaction-event-creation-context.interfac';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';

@Injectable()
export class TransactionJobsCooperativeBankOfOromiaService {
  constructor(
    private readonly cooperativeBankOfOromiaService: CooperativeBankOfOromiaService,
    private readonly transactionJobsHelperService: TransactionJobsHelperService,
    private readonly transactionsService: TransactionsService,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
  ) {}

  public async processCooperativeBankOfOromiaTransactionJob(
    transactionJob: CooperativeBankOfOromiaTransactionJobDto,
  ): Promise<void> {
    // Log transaction-job start: create 'initiated'/'retry' transaction event, set transaction to 'waiting' and update registration (if 'initiated')
    const transactionEventContext: TransactionEventCreationContext = {
      transactionId: transactionJob.transactionId,
      userId: transactionJob.userId,
      programFspConfigurationId: transactionJob.programFspConfigurationId,
    };
    await this.transactionJobsHelperService.logTransactionJobStart({
      context: transactionEventContext,
      isRetry: transactionJob.isRetry,
    });

    // Inner function.
    const handleTransferResult = async (
      status: TransactionStatusEnum,
      errorText?: string,
    ) => {
      await this.transactionsService.saveProgress({
        context: transactionEventContext,
        newTransactionStatus: status,
        errorMessage: errorText,
        description:
          TransactionEventDescription.cooperativeBankOfOromiaRequestSent,
      });
    };

    const debitAccountNumber =
      await this.programFspConfigurationRepository.getPropertyValueByNameOrThrow(
        {
          programFspConfigurationId: transactionJob.programFspConfigurationId,
          name: FspConfigurationProperties.debitAccountNumber,
        },
      );

    // messageId is the idempotency key
    const cooperativeBankOfOromiaMessageId = this.generateMessageId({
      referenceId: transactionJob.referenceId,
      transactionId: transactionJob.transactionId,
    });

    try {
      await this.cooperativeBankOfOromiaService.initiateTransfer({
        cooperativeBankOfOromiaMessageId,
        recipientCreditAccountNumber: transactionJob.bankAccountNumber,
        debitAccountNumber,
        amount: transactionJob.transferValue,
      });
    } catch (error) {
      if (!(error instanceof CooperativeBankOfOromiaError)) {
        throw error;
      }
      // We know that duplicates only occur in case the first attemp was successful in the jobs retry scenario
      // It is still good to store the transacion as success as because the job could have been stopped before marking it as success
      if (error.type === CooperativeBankOfOromiaTransferResultEnum.duplicate) {
        await handleTransferResult(TransactionStatusEnum.success);
        return; // Don't continue processing the job.
      }

      await handleTransferResult(TransactionStatusEnum.error, error.message);
      return; // Don't continue processing the job.
    }

    // 3. Handle success response.
    return await handleTransferResult(TransactionStatusEnum.success);
  }

  private generateMessageId({
    referenceId,
    transactionId,
  }: {
    referenceId: string;
    transactionId: number;
  }): string {
    // Coopbank only stores the messageId upon a successful transaction. Therefore we only need a unique idempotency key per:
    // - referenceId
    // - 121 transactionId
    // - AND NOT per attempt (for retries)

    const toHash = `ReferenceId=${referenceId},TransactionId=${transactionId}`;

    // This is deterministic.
    const messageId = crypto
      .createHash('sha256')
      .update(toHash, 'utf8')
      .digest('hex');

    return messageId.slice(0, 12); // Cooperative Bank of Oromia requires max 12 alpha numeric chars
  }
}
