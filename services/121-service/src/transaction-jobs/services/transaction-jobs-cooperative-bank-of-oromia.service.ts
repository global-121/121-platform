import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

import { FspConfigurationProperties } from '@121-service/src/fsps/enums/fsp-name.enum';
import { CooperativeBankOfOromiaTransferResultEnum } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/enums/cooperative-bank-of-oromia-disbursement-result.enum';
import { CooperativeBankOfOromiaError } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/errors/cooperative-bank-of-oromia.error';
import { CooperativeBankOfOromiaService } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/services/cooperative-bank-of-oromia.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventCreationContext } from '@121-service/src/payments/transactions/transaction-events/interfaces/transaction-event-creation-context.interfac';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { SaveTransactionProgressAndUpdateRegistrationContext } from '@121-service/src/transaction-jobs/interfaces/save-transaction-progress-and-update-registration-context.interface';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';
import { CooperativeBankOfOromiaTransactionJobDto } from '@121-service/src/transaction-queues/dto/cooperative-bank-of-oromia-transaction-job.dto';

@Injectable()
export class TransactionJobsCooperativeBankOfOromiaService {
  constructor(
    private readonly cooperativeBankOfOromiaService: CooperativeBankOfOromiaService,
    private readonly transactionJobsHelperService: TransactionJobsHelperService,
    private readonly transactionEventScopedRepository: TransactionEventsScopedRepository,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
  ) {}

  public async processCooperativeBankOfOromiaTransactionJob(
    transactionJob: CooperativeBankOfOromiaTransactionJobDto,
  ): Promise<void> {
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
      const saveTransactionProgressAndUpdateRegistrationContext: SaveTransactionProgressAndUpdateRegistrationContext =
        {
          transactionEventContext,
          referenceId: transactionJob.referenceId,
          isRetry: transactionJob.isRetry,
        };
      await this.transactionJobsHelperService.saveTransactionProgressAndUpdateRegistration(
        {
          context: saveTransactionProgressAndUpdateRegistrationContext,
          newTransactionStatus: status,
          errorMessage: errorText,
          description:
            TransactionEventDescription.cooperativeBankOfOromiaRequestSent,
        },
      );
    };

    const debitAccountNumber =
      (await this.programFspConfigurationRepository.getPropertyValueByName({
        programFspConfigurationId: transactionJob.programFspConfigurationId,
        name: FspConfigurationProperties.debitAccountNumber,
      })) as string; // This must be a string. If it is undefined the validation in payment service should have caught it. If a user set it as an array string you should get an internal server error here, this seems like an edge case;

    const failedTransactionAttempts =
      await this.transactionEventScopedRepository.countFailedTransactionAttempts(
        transactionJob.transactionId,
      );

    const cooperativeBankOfOromiaMessageId = this.generateMessageId({
      referenceId: transactionJob.referenceId,
      transactionId: transactionJob.transactionId,
      failedTransactionAttempts,
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
    failedTransactionAttempts,
  }: {
    referenceId: string;
    transactionId: number;
    failedTransactionAttempts: number;
  }): string {
    // We need a messageId that's unique for the combination of:
    // - referenceId
    // - 121 transactionId
    // - failedTransactionAttempts (to ensure that each retry gets a different messageId)

    const toHash = `ReferenceId=${referenceId},TransactionId=${transactionId},Attempt=${failedTransactionAttempts}`;

    // This is deterministic.
    const messageId = crypto
      .createHash('sha256')
      .update(toHash, 'utf8')
      .digest('hex');

    return messageId.slice(0, 12); // Cooperative Bank of Oromia requires max 12 alpha numeric chars
  }
}
