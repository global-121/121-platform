import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

import { env } from '@121-service/src/env';
import { CooperativeBankOfOromiaDisbursementResultEnum } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/enums/cooperative-bank-of-oromia-disbursement-result.enum';
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
    private readonly airtelService: CooperativeBankOfOromiaService,
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
    const handleDisbursementResult = async (
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

    /*
      If any of these steps fail we throw so the transaction fails and a new job
      is created.
      We explicitly *don't* work around the following problems, if any of this
      happens we just fail the transaction.
      - database problems
        - data that should have been saved but can't be found
      - network problems
        - slow response
        - no response (timeout)
      - CooperativeBankOfOromia API problems
        - endpoints generating un-parsable responses
        - disbursements that are on pending indefinitely
    */
    // 1. Prepare.

    const failedTransactionAttempts =
      await this.transactionEventScopedRepository.countFailedTransactionAttempts(
        transactionJob.transactionId,
      );

    const cooperativeBankOfOromiaTransactionId = this.generateAirtelTransactionId({
      referenceId: transactionJob.referenceId,
      transactionId: transactionJob.transactionId,
      failedTransactionAttempts,
    });

    // 2. Attempt disbursement, if one already exists we automatically check it.
    try {
      // await doDisbursement(transactionJob, failedTransactionsCount);
      await this.airtelService.attemptOrCheckDisbursement({
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

      // This very specific error shouldn't generally occur, if it does happen
      // just retrying the transaction is not good enough, the end user needs to
      // contact CooperativeBankOfOromia and troubleshoot. This is why we (ab)use the waiting
      // state for this transaction.
      if (error.type === CooperativeBankOfOromiaDisbursementResultEnum.ambiguous) {
        await handleDisbursementResult(
          TransactionStatusEnum.waiting,
          error?.message,
        );
      } else {
        await handleDisbursementResult(
          TransactionStatusEnum.error,
          error?.message,
        );
      }
      return; // Don't continue processing the job.
    }

    // 3. Handle success response. (If no error was thrown, we are certain the
    //    disbursement was successful.)
    return await handleDisbursementResult(TransactionStatusEnum.success);
  }

  private generateAirtelTransactionId = ({
    referenceId,
    transactionId,
    failedTransactionAttempts,
  }: {
    referenceId: string;
    transactionId: number;
    failedTransactionAttempts: number;
  }): string => {
    // We need an cooperative-bank-of-oromia transactionId that's unique for the combination of:
    // - referenceId
    // - 121 tansactionId
    // - failedTransactionAttempts (to ensure that each retry gets a different transactionId)
    // But then it also needs to be a valid CooperativeBankOfOromia transactionId, which is a
    // string that "must not be null or blank and should only contain
    // alphanumeric characters with length between 5 and 80 characters".

    const toHash = `ReferenceId=${referenceId},TransactionId=${transactionId},Attempt=${failedTransactionAttempts}`;
    // The cooperativeBankOfOromiaTransactionId "must not be null or blank and should only
    // contain alphanumeric characters with length between 5 and 80
    // characters"
    // This is deterministic.
    const cooperativeBankOfOromiaTransactionId = crypto
      .createHash('sha256') // Always 64 chars
      .update(toHash, 'utf8')
      .digest('hex');

    return cooperativeBankOfOromiaTransactionId;
  };
}
