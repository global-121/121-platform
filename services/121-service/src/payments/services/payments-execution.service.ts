import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { PaymentEvent } from '@121-service/src/payments/payment-events/enums/payment-event.enum';
import { PaymentEventsService } from '@121-service/src/payments/payment-events/payment-events.service';
import { PaymentsHelperService } from '@121-service/src/payments/services/payments-helper.service';
import { PaymentsProgressHelperService } from '@121-service/src/payments/services/payments-progress.helper.service';
import { TransactionJobsCreationService } from '@121-service/src/payments/services/transaction-jobs-creation.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionViewScopedRepository } from '@121-service/src/payments/transactions/repositories/transaction.view.scoped.repository';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventType } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-type.enum';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { BulkActionResultRetryPaymentDto } from '@121-service/src/registration/dto/bulk-action-result.dto';

@Injectable()
export class PaymentsExecutionService {
  public constructor(
    private readonly transactionViewScopedRepository: TransactionViewScopedRepository,
    private readonly transactionJobsCreationService: TransactionJobsCreationService,
    private readonly paymentsProgressHelperService: PaymentsProgressHelperService,
    private readonly paymentsHelperService: PaymentsHelperService,
    private readonly paymentEventsService: PaymentEventsService,
    private readonly transactionsService: TransactionsService,
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
      // check that all FSP configurations are still valid
      const uniqueFspConfigsForPendingApprovalTransactions =
        await this.transactionViewScopedRepository.getUniqueProgramFspConfigForPendingApproval(
          {
            programId,
            paymentId,
          },
        );
      if (uniqueFspConfigsForPendingApprovalTransactions.length === 0) {
        throw new HttpException(
          {
            errors:
              'No "pending approval" transactions found for this payment.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      const fspConfigNames = uniqueFspConfigsForPendingApprovalTransactions.map(
        (p) => p.programFspConfigurationName,
      );
      await this.paymentsHelperService.checkFspConfigurationsOrThrow(
        programId,
        fspConfigNames,
      );

      // store payment events
      // TODO these 2 actions will later be slit up. For now they are together.
      await this.paymentEventsService.createEvent({
        paymentId,
        userId,
        type: PaymentEvent.approved,
      });
      await this.paymentEventsService.createEvent({
        paymentId,
        userId,
        type: PaymentEvent.started,
      });

      // process transactions to-fail and to-start
      const fspConfigIds = uniqueFspConfigsForPendingApprovalTransactions.map(
        (p) => p.programFspConfigurationId,
      );
      await this.markTransactionsAsFailed({
        fspConfigIds,
        userId,
        programId,
        paymentId,
      });
      await this.markTransactionsAsApprovedAndStartQueue({
        fspConfigIds,
        userId,
        programId,
        paymentId,
      });
    } finally {
      await this.paymentsProgressHelperService.unlockPaymentsForProgram(
        programId,
      );
    }
  }

  private async markTransactionsAsApprovedAndStartQueue({
    fspConfigIds,
    userId,
    programId,
    paymentId,
  }: {
    fspConfigIds: number[];
    userId: number;
    programId: number;
    paymentId: number;
  }) {
    const transactionsToStart =
      await this.transactionViewScopedRepository.getPendingApprovalOfIncludedRegistrations(
        {
          programId,
          paymentId,
        },
      );
    for (const programFspConfigurationId of fspConfigIds) {
      const fspConfigTransactions = transactionsToStart.filter(
        (t) => t.programFspConfigurationId === programFspConfigurationId,
      );
      if (fspConfigTransactions.length === 0) {
        continue;
      }
      await this.transactionsService.saveProgressBulk({
        newTransactionStatus: TransactionStatusEnum.approved,
        transactionIds: fspConfigTransactions.map((t) => t.id),
        description: TransactionEventDescription.approval,
        type: TransactionEventType.approval,
        userId,
        programFspConfigurationId,
      });
    }

    await this.createTransactionJobs({
      programId,
      transactionIds: transactionsToStart.map((t) => t.id),
      userId,
      isRetry: false,
    });
  }

  private async markTransactionsAsFailed({
    fspConfigIds,
    userId,
    programId,
    paymentId,
  }: {
    fspConfigIds: number[];
    userId: number;
    programId: number;
    paymentId: number;
  }) {
    const transactionsToFail =
      await this.transactionViewScopedRepository.getPendingApprovalOfNonIncludedRegistrations(
        {
          programId,
          paymentId,
        },
      );
    for (const programFspConfigurationId of fspConfigIds) {
      const fspConfigTransactions = transactionsToFail.filter(
        (t) => t.programFspConfigurationId === programFspConfigurationId,
      );
      if (fspConfigTransactions.length === 0) {
        continue;
      }
      await this.transactionsService.saveProgressBulk({
        newTransactionStatus: TransactionStatusEnum.error,
        transactionIds: transactionsToFail.map((t) => t.id),
        description: TransactionEventDescription.approval,
        type: TransactionEventType.approval,
        userId,
        programFspConfigurationId,
        errorMessages: new Map<number, string>(
          transactionsToFail.map((t) => [
            t.id,
            'Registration did not have status included at the time of starting the payment',
          ]),
        ),
      });
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
