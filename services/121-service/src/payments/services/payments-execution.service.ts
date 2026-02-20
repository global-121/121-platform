import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PaginateQuery } from 'nestjs-paginate';
import { Equal } from 'typeorm';

import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { PaymentEvent } from '@121-service/src/payments/payment-events/enums/payment-event.enum';
import { PaymentEventsService } from '@121-service/src/payments/payment-events/payment-events.service';
import { PaymentApprovalRepository } from '@121-service/src/payments/repositories/payment-approval.repository';
import { PaymentsHelperService } from '@121-service/src/payments/services/payments-helper.service';
import { PaymentsProgressHelperService } from '@121-service/src/payments/services/payments-progress.helper.service';
import { PaymentsReportingService } from '@121-service/src/payments/services/payments-reporting.service';
import { TransactionJobsCreationService } from '@121-service/src/payments/services/transaction-jobs-creation.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionViewScopedRepository } from '@121-service/src/payments/transactions/repositories/transaction.view.scoped.repository';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { BulkActionResultDto } from '@121-service/src/registration/dto/bulk-action-result.dto';

@Injectable()
export class PaymentsExecutionService {
  public constructor(
    private readonly transactionViewScopedRepository: TransactionViewScopedRepository,
    private readonly transactionJobsCreationService: TransactionJobsCreationService,
    private readonly paymentsProgressHelperService: PaymentsProgressHelperService,
    private readonly paymentsHelperService: PaymentsHelperService,
    private readonly paymentEventsService: PaymentEventsService,
    private readonly transactionsService: TransactionsService,
    private readonly paymentsReportingService: PaymentsReportingService,
    private readonly paymentApprovalRepository: PaymentApprovalRepository,
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
      const notCompletedApprovals = await this.paymentApprovalRepository.count({
        where: {
          paymentId: Equal(paymentId),
          approved: Equal(false),
        },
      });
      if (notCompletedApprovals > 0) {
        throw new HttpException(
          `Cannot start payment. There are ${notCompletedApprovals} approval(s) to be done for this payment.`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // check that all FSP configurations are still valid
      const uniqueFspConfigsForApprovedTransactions =
        await this.transactionViewScopedRepository.getUniqueProgramFspConfigForApprovedTransactions(
          {
            programId,
            paymentId,
          },
        );
      if (uniqueFspConfigsForApprovedTransactions.length === 0) {
        throw new HttpException(
          'No "approved" transactions found for this payment.',
          HttpStatus.BAD_REQUEST,
        );
      }
      const fspConfigNames = uniqueFspConfigsForApprovedTransactions.map(
        (p) => p.programFspConfigurationName,
      );
      await this.paymentsHelperService.checkFspConfigurationsOrThrow(
        programId,
        fspConfigNames,
      );

      // store payment event
      await this.paymentEventsService.createEvent({
        paymentId,
        userId,
        type: PaymentEvent.started,
      });

      // process transactions to-fail ..
      const fspConfigIds = uniqueFspConfigsForApprovedTransactions.map(
        (p) => p.programFspConfigurationId,
      );
      await this.markTransactionsAsFailed({
        fspConfigIds,
        userId,
        programId,
        paymentId,
      });

      // .. and to start
      await this.startQueue({
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

  private async startQueue({
    userId,
    programId,
    paymentId,
  }: {
    userId: number;
    programId: number;
    paymentId: number;
  }) {
    const transactionsToStart =
      await this.transactionViewScopedRepository.getByStatusOfIncludedRegistrations(
        {
          programId,
          paymentId,
          status: TransactionStatusEnum.approved,
        },
      );
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
      await this.transactionViewScopedRepository.getByStatusOfNonIncludedRegistrations(
        {
          programId,
          paymentId,
          status: TransactionStatusEnum.approved,
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
    paginateQuery,
    dryRun,
  }: {
    userId: number;
    programId: number;
    paymentId: number;
    paginateQuery: PaginateQuery;
    dryRun: boolean;
  }): Promise<BulkActionResultDto> {
    await this.paymentsReportingService.findPaymentOrThrow(
      programId,
      paymentId,
    );

    if (dryRun) {
      await this.paymentsProgressHelperService.checkPaymentInProgressAndThrow(
        programId,
      );
    } else {
      // Only lock payments when not a dry run
      await this.paymentsProgressHelperService.checkAndLockPaymentProgressOrThrow(
        { programId },
      );
    }

    // do all operations UP TO starting the queue in a try, so that we can always end with a unblock-payments action, also in case of failure
    // from the moment of starting the queue the in-progress checking is taken over by the queue
    try {
      const referenceIds =
        await this.paymentsReportingService.getReferenceIdsForPaginateQuery({
          programId,
          paymentId,
          paginateQuery,
        });

      const transactionDetails = await this.getRetryTransactionDetailsOrThrow({
        programId,
        paymentId,
        inputReferenceIds: referenceIds,
      });

      const bulkActionResult: BulkActionResultDto = {
        totalFilterCount: referenceIds.length,
        applicableCount: transactionDetails.length,
        nonApplicableCount: referenceIds.length - transactionDetails.length,
      };

      if (dryRun) {
        return bulkActionResult;
      }

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

      return bulkActionResult;
    } finally {
      if (!dryRun) {
        await this.paymentsProgressHelperService.unlockPaymentsForProgram(
          programId,
        );
      }
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
    inputReferenceIds: string[];
  }): Promise<
    { transactionId: number; programFspConfigurationName: string }[]
  > {
    const failedTransactionForPayment =
      await this.transactionViewScopedRepository.getFailedTransactionDetailsForRetry(
        { programId, paymentId },
      );
    if (!failedTransactionForPayment.length) {
      const errors = 'No failed transactions found for this payment.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const transactionsToRetry = inputReferenceIds
      ? failedTransactionForPayment.filter((t) =>
          inputReferenceIds?.includes(t.registrationReferenceId),
        )
      : failedTransactionForPayment;

    if (transactionsToRetry.length === 0) {
      const errors = `No failed transactions found for this filter.`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    return transactionsToRetry.map((t) => {
      return {
        transactionId: t.id,
        programFspConfigurationName: t.programFspConfigurationName,
      };
    });
  }
}
