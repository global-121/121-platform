import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { Equal } from 'typeorm';

import { env } from '@121-service/src/env';
import { AirtelDisbursementResultEnum } from '@121-service/src/payments/fsp-integration/airtel/enums/airtel-disbursement-result.enum';
import { AirtelError } from '@121-service/src/payments/fsp-integration/airtel/errors/airtel.error';
import { AirtelService } from '@121-service/src/payments/fsp-integration/airtel/services/airtel.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.scoped.repository';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';
import { AirtelTransactionJobDto } from '@121-service/src/transaction-queues/dto/airtel-transaction-job.dto';

@Injectable()
export class TransactionJobsAirtelService {
  constructor(
    private readonly airtelService: AirtelService,
    private readonly transactionScopedRepository: TransactionScopedRepository,
    private readonly transactionJobsHelperService: TransactionJobsHelperService,
  ) {}

  public async processAirtelTransactionJob(
    transactionJob: AirtelTransactionJobDto,
  ): Promise<void> {
    if (!env.AIRTEL_ENABLED) {
      console.error(
        'Airtel FSP is not enabled, not processing transaction jobs.',
      );
    }
    // Inner function.
    const handleDisbursementResult = async (
      status: TransactionStatusEnum,
      errorText?: string,
    ) => {
      await this.transactionJobsHelperService.createTransactionAndUpdateRegistration(
        {
          registration,
          transactionJob,
          transferAmountInMajorUnit: transactionJob.transactionAmount,
          status,
          errorText,
        },
      );
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
      - Airtel API problems
        - endpoints generating unparseable responses
        - disbursements that are on pending indefinitely
    */
    // 1. Prepare.

    // We expect the registration to exist because it was used to create the
    // transaction job.
    const registration =
      await this.transactionJobsHelperService.getRegistrationOrThrow(
        transactionJob.referenceId,
      );

    const failedTransactionsCount =
      await this.transactionScopedRepository.count({
        where: {
          registrationId: Equal(registration.id),
          paymentId: Equal(transactionJob.paymentId),
          status: Equal(TransactionStatusEnum.error),
        },
      });

    const airtelTransactionId = this.generateAirtelTransactionId({
      referenceId: transactionJob.referenceId,
      paymentNumber: transactionJob.paymentId,
      failedTransactionsCount,
    });

    // 2. Attempt disbursement, if one already exists we automatically check it.
    try {
      // await doDisbursement(transactionJob, failedTransactionsCount);
      await this.airtelService.attemptOrCheckDisbursement({
        airtelTransactionId,
        phoneNumber: transactionJob.phoneNumber,
        amount: transactionJob.transactionAmount,
      });
    } catch (error) {
      // We only want to write a specific set of errors to transactions, outside
      // of this set: rethrow.
      if (!(error instanceof AirtelError)) {
        throw error;
      }

      // This very specific error shouldn't generally occur, if it does happen
      // just retrying the transaction is not good enough, the end user needs to
      // contact Airtel and troubleshoot. This is why we (ab)use the waiting
      // state for this transaction.
      if (error.type === AirtelDisbursementResultEnum.ambiguous) {
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
    paymentNumber,
    failedTransactionsCount,
  }: {
    referenceId: string;
    paymentNumber: number;
    failedTransactionsCount: number;
  }): string => {
    // We need a transactionId that's unique for the combination of:
    // - referenceId
    // - paymentNumber
    // - failedTransactionsCount (to ensure that each retry gets a different transactionId)
    // But then it also needs to be a valid Airtel transactionId, which is a
    // string that "must not be null or blank and should only contain
    // alphanumeric characters with length between 5 and 80 characters".

    const toHash = `ReferenceId=${referenceId},PaymentNumber=${paymentNumber},Attempt=${failedTransactionsCount}`;
    // The airtelTransactionId "must not be null or blank and should only
    // contain alphanumeric characters with length between 5 and 80
    // characters"
    // This is deterministic.
    const airtelTransactionId = crypto
      .createHash('sha256') // Always 64 chars
      .update(toHash, 'utf8')
      .digest('hex');

    return airtelTransactionId;
  };
}
