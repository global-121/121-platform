import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { Equal } from 'typeorm';

import { AirtelService } from '@121-service/src/payments/fsp-integration/airtel/airtel.service';
import { AirtelDisbursementResultEnum } from '@121-service/src/payments/fsp-integration/airtel/enums/airtel-disbursement-result.enum';
import { AirtelError } from '@121-service/src/payments/fsp-integration/airtel/errors/airtel.error';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';
import { AirtelTransactionJobDto } from '@121-service/src/transaction-queues/dto/airtel-transaction-job.dto';

@Injectable()
export class TransactionJobsAirtelService {
  constructor(
    private readonly airtelService: AirtelService,
    private readonly transactionScopedRepository: TransactionScopedRepository,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly transactionJobsHelperService: TransactionJobsHelperService,
  ) {}

  public async processAirtelTransactionJob(
    transactionJob: AirtelTransactionJobDto,
  ): Promise<void> {
    // ## TODO: Not sure if creating a bunch of utility/helper functions inside of this function are an OK pattern.

    const doDisbursement = async (
      transactionJob,
      failedTransactionsCount,
    ): Promise<void> => {
      // We need a transactionId that's unique for the combination of:
      // - referenceId
      // - paymentNumber
      // - failedTransactionsCount (to ensure that each retry gets a different transactionId)
      // But then it also needs to be a valid Airtel transactionId, which is a
      // string that "must not be null or blank and should only contain
      // alphanumeric characters with length between 5 and 80 characters".

      const toHash = `ReferenceId=${transactionJob.referenceId},PaymentNumber=${transactionJob.paymentNumber},Attempt=${failedTransactionsCount}`;
      // The airtelTransactionId "must not be null or blank and should only contain alphanumeric characters with length between 5 and 80 characters"
      const airtelTransactionId = crypto
        .createHash('sha256')
        .update(toHash, 'utf8')
        .digest('hex');

      // 2. Do disbursement.
      const phoneNumber = transactionJob.phoneNumber;
      const amount = transactionJob.transactionAmount;
      // ## TODO: actually pass result
      await this.airtelService.attemptOrCheckDisbursement({
        airtelTransactionId,
        phoneNumber,
        amount,
      });
    };

    // ✳️✳️✳️✳️✳️✳️✳️✳️✳️✳️✳️✳️✳️✳️✳️✳️✳️✳️✳️✳️✳️
    // Actual start of processing
    /*
      If any of these steps fail we throw so the transaction fails and a new job is created.
      We *explicitly* don't work around the following problems, if any of this happens we just fail the transaction. If need be we can always later introduce retries.
      - database problems
        - data that should have been saved but can't be found
      - network problems
        - slow response
        - no response (timeout)
      - Airtel API problems
        - endpoints generating unparseable responses
        - disbursements that are on pending indefinitely
    */
    // Transaction objects need registrations; if this fails we don't create a failed transaction.
    // That's also the case for the other job processors.
    // Should we account for that?
    // For now we assume this always works.

    // 1. Prepare.
    const registration =
      await this.transactionJobsHelperService.getRegistrationOrThrow(
        transactionJob.referenceId,
      );

    const failedTransactionsCount =
      await this.transactionScopedRepository.count({
        where: {
          registrationId: Equal(registration.id),
          payment: Equal(transactionJob.paymentNumber),
          status: Equal(TransactionStatusEnum.error),
        },
      });

    // Helper function to decrease repetition.
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

    try {
      await doDisbursement(transactionJob, failedTransactionsCount);
    } catch (error) {
      // This very specific error shouldn't generally occur, if it does happen
      // just retrying the transaction is not good enough, the end user needs to
      // contact Airtel and troubleshoot. This is why we (ab)use the waiting
      // state for this transaction.
      if (
        error instanceof AirtelError &&
        error.type === AirtelDisbursementResultEnum.ambiguous
      ) {
        return await handleDisbursementResult(
          TransactionStatusEnum.waiting,
          error?.message,
        );
      }
      return await handleDisbursementResult(
        TransactionStatusEnum.error,
        error?.message,
      );
    }
    // If no error was thrown, we are certain the disbursement was successful.
    return await handleDisbursementResult(TransactionStatusEnum.success);
  }
}
