import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { PaymentEvent } from '@121-service/src/payments/payment-events/enums/payment-event.enum';
import { PaymentEventsService } from '@121-service/src/payments/payment-events/payment-events.service';
import { PaymentsExecutionHelperService } from '@121-service/src/payments/services/payments-execution-helper.service';
import { PaymentsHelperService } from '@121-service/src/payments/services/payments-helper.service';
import { PaymentsProgressHelperService } from '@121-service/src/payments/services/payments-progress.helper.service';
import { TransactionJobsCreationService } from '@121-service/src/payments/services/transaction-jobs-creation.service';
import { TransactionViewScopedRepository } from '@121-service/src/payments/transactions/repositories/transaction.view.scoped.repository';
import { BulkActionResultRetryPaymentDto } from '@121-service/src/registration/dto/bulk-action-result.dto';

@Injectable()
export class PaymentsExecutionService {
  public constructor(
    private readonly transactionViewScopedRepository: TransactionViewScopedRepository,
    private readonly transactionJobsCreationService: TransactionJobsCreationService,
    private readonly paymentsProgressHelperService: PaymentsProgressHelperService,
    private readonly paymentsExecutionHelperService: PaymentsExecutionHelperService,
    private readonly paymentsHelperService: PaymentsHelperService,
    private readonly paymentEventsService: PaymentEventsService,
  ) {}

  public async startPayment({
    userId,
    programId,
    paymentId,
  }: {
    userId: number;
    programId: number;
    paymentId: number;
  }): Promise<void> {
    await this.paymentsProgressHelperService.checkAndLockPaymentProgressOrThrow(
      { programId },
    );

    try {
      const transactionsToStart =
        await this.transactionViewScopedRepository.getCreatedTransactionsOfIncludedRegistrations(
          {
            programId,
            paymentId,
          },
        );
      if (transactionsToStart.length === 0) {
        throw new HttpException(
          {
            errors:
              'No created transactions found for included registrations for this payment.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const programFspConfigurationNames: string[] = Array.from(
        new Set(
          transactionsToStart
            .map((t) => t.programFspConfigurationName)
            .filter((fsp): fsp is string => fsp !== null),
        ),
      );

      await this.paymentsHelperService.checkFspConfigurationsOrThrow(
        programId,
        programFspConfigurationNames,
      );

      await this.paymentEventsService.createEvent({
        paymentId,
        userId,
        type: PaymentEvent.started,
      });

      await this.paymentsExecutionHelperService.updatePaymentCountAndSetToCompleted(
        {
          registrationIds: transactionsToStart.map((t) => t.registrationId),
          programId,
          userId,
        },
      );

      await this.createTransactionJobs({
        programId,
        transactionIds: transactionsToStart.map((t) => t.id),
        userId,
        isRetry: false,
      });
    } finally {
      await this.paymentsProgressHelperService.unlockPaymentsForProgram(
        programId,
      );
    }
  }

  public async retryPayment({
    userId,
    programId,
    paymentId,
    referenceIds,
  }: {
    userId: number;
    programId: number;
    paymentId: number;
    referenceIds?: string[];
  }): Promise<BulkActionResultRetryPaymentDto> {
    await this.paymentsProgressHelperService.checkAndLockPaymentProgressOrThrow(
      { programId },
    );

    // do all operations UP TO starting the queue in a try, so that we can always end with a unblock-payments action, also in case of failure
    // from the moment of starting the queue the in-progress checking is taken over by the queue
    try {
      const transactionDetails = await this.getRetryTransactionDetailsOrThrow({
        programId,
        paymentId,
        inputReferenceIds: referenceIds,
      });

      await this.paymentEventsService.createEvent({
        paymentId,
        userId,
        type: PaymentEvent.retry,
      });

      await this.createTransactionJobs({
        programId,
        transactionIds: transactionDetails.map((t) => t.transactionId),
        userId,
        isRetry: true,
      });
      const programFspConfigurationNames: string[] = [];
      // This loop is pretty fast: with 131k registrations it takes ~38ms
      for (const transaction of transactionDetails) {
        if (
          !programFspConfigurationNames.includes(
            transaction.programFspConfigurationName,
          )
        ) {
          programFspConfigurationNames.push(
            transaction.programFspConfigurationName,
          );
        }
      }
      return {
        totalFilterCount: transactionDetails.length,
        applicableCount: transactionDetails.length,
        nonApplicableCount: 0,
        programFspConfigurationNames,
      };
    } finally {
      await this.paymentsProgressHelperService.unlockPaymentsForProgram(
        programId,
      );
    }
  }

  private async createTransactionJobs({
    programId,
    userId,
    transactionIds,
    isRetry = false,
  }: {
    programId: number;
    transactionIds: number[];
    userId: number;
    isRetry?: boolean;
  }): Promise<void> {
    const transactionJobCreationDetails =
      await this.transactionViewScopedRepository.getTransactionJobCreationDetails(
        transactionIds,
      );

    for (const fspName of Object.values(Fsps)) {
      const transactionJobCreationDetailsForFsp =
        transactionJobCreationDetails.filter((job) => job.fspName === fspName);

      if (transactionJobCreationDetailsForFsp.length > 0) {
        await this.transactionJobsCreationService.addTransactionJobsForFsp({
          fspName,
          transactionJobDetails: transactionJobCreationDetailsForFsp.map(
            (job) => ({
              referenceId: job.referenceId,
              transferValue: job.transferValue,
              transactionId: job.transactionId!,
            }),
          ),
          userId,
          programId,
          isRetry,
        });
      }
    }
  }

  private async getRetryTransactionDetailsOrThrow({
    programId,
    paymentId,
    inputReferenceIds,
  }: {
    programId: number;
    paymentId: number;
    inputReferenceIds?: string[];
  }): Promise<
    { transactionId: number; programFspConfigurationName: string }[]
  > {
    const failedTransactionForPayment =
      await this.transactionViewScopedRepository.getFailedTransactionDetailsForRetry(
        { programId, paymentId },
      );

    const referenceIdsWithLatestTransactionFailedForPayment =
      failedTransactionForPayment.map((t) => t.registrationReferenceId);

    if (!referenceIdsWithLatestTransactionFailedForPayment.length) {
      const errors = 'No failed transactions found for this payment.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    // Throw an error if incoming referenceIds are not part of the failed transactions for this payment
    if (inputReferenceIds) {
      for (const referenceId of inputReferenceIds) {
        if (
          !referenceIdsWithLatestTransactionFailedForPayment.includes(
            referenceId,
          )
        ) {
          const errors = `The registration with referenceId ${referenceId} does not have a failed transaction for this payment.`;
          throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
        }
      }
    }

    const transactionsToRetry = inputReferenceIds
      ? failedTransactionForPayment.filter((t) =>
          inputReferenceIds?.includes(t.registrationReferenceId),
        )
      : failedTransactionForPayment;

    return transactionsToRetry.map((t) => {
      return {
        transactionId: t.id,
        programFspConfigurationName: t.programFspConfigurationName,
      };
    });
  }
}
