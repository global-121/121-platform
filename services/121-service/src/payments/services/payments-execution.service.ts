import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PaginateQuery } from 'nestjs-paginate';
import { Equal } from 'typeorm';

import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { PaymentEvent } from '@121-service/src/payments/payment-events/enums/payment-event.enum';
import { PaymentEventsService } from '@121-service/src/payments/payment-events/payment-events.service';
import { PaymentApprovalRepository } from '@121-service/src/payments/repositories/payment-approval.repository';
import { PaymentsProgressService } from '@121-service/src/payments/services/payments-progress.service';
import { PaymentsReportingService } from '@121-service/src/payments/services/payments-reporting.service';
import { TransactionJobsCreationService } from '@121-service/src/payments/services/transaction-jobs-creation.service';
import { TransactionViewEntity } from '@121-service/src/payments/transactions/entities/transaction-view.entity';
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
    private readonly paymentsProgressService: PaymentsProgressService,
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
    await this.paymentsProgressService.checkAndLockPaymentProgressOrThrow({
      programId,
    });

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

      await this.paymentEventsService.createEvent({
        paymentId,
        userId,
        type: PaymentEvent.started,
      });

      await this.markTransactionsAsFailedForNotConfiguredFsps({
        userId,
        programId,
        paymentId,
      });

      await this.markTransactionsAsFailedForNotIncludedRegistrations({
        userId,
        programId,
        paymentId,
      });

      await this.startQueue({
        userId,
        programId,
        paymentId,
      });
    } finally {
      await this.paymentsProgressService.unlockPaymentsForProgram(programId);
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

  private async markTransactionsAsFailedForNotIncludedRegistrations({
    userId,
    programId,
    paymentId,
  }: {
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
    await this.failTransactions({
      transactions: transactionsToFail,
      userId,
      errorMessage:
        'Registration did not have status included at the time of starting the payment',
    });
  }

  private async markTransactionsAsFailedForNotConfiguredFsps({
    userId,
    programId,
    paymentId,
  }: {
    userId: number;
    programId: number;
    paymentId: number;
  }) {
    const transactionsToFail =
      await this.transactionViewScopedRepository.getByStatusOfNonConfiguredFsps(
        {
          programId,
          paymentId,
          status: TransactionStatusEnum.approved,
        },
      );
    await this.failTransactions({
      transactions: transactionsToFail,
      userId,
      errorMessage: 'FSP configuration is not fully configured',
    });
  }

  private async failTransactions({
    transactions,
    userId,
    errorMessage,
  }: {
    transactions: TransactionViewEntity[];
    userId: number;
    errorMessage: string;
  }) {
    const transactionIdsByFspConfigId = this.mapTransactionIdsToFspConfigId(transactions);

    for (const [
      programFspConfigurationId,
      transactionIds,
    ] of transactionIdsByFspConfigId) {
      await this.transactionsService.saveProgressBulk({
        newTransactionStatus: TransactionStatusEnum.error,
        transactionIds,
        description: TransactionEventDescription.approval,
        userId,
        programFspConfigurationId,
        errorMessages: new Map(transactionIds.map((id) => [id, errorMessage])),
      });
    }
  }

  private mapTransactionIdsToFspConfigId(
    transactions: TransactionViewEntity[],
  ): Map<number, number[]> {
    const transactionIdsByFspConfigId = new Map<number, number[]>();

    for (const { id, programFspConfigurationId } of transactions) {
      if (programFspConfigurationId === null) {
        continue;
      }
      const transactionIds =
        transactionIdsByFspConfigId.get(programFspConfigurationId) ?? [];
      transactionIds.push(id);
      transactionIdsByFspConfigId.set(
        programFspConfigurationId,
        transactionIds,
      );
    }
    return transactionIdsByFspConfigId;
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
      await this.paymentsProgressService.checkPaymentInProgressAndThrow(
        programId,
      );
    } else {
      // Only lock payments when not a dry run
      await this.paymentsProgressService.checkAndLockPaymentProgressOrThrow({
        programId,
      });
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
        await this.paymentsProgressService.unlockPaymentsForProgram(programId);
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
