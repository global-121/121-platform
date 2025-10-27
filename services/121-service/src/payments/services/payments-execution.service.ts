import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { AdditionalActionType } from '@121-service/src/actions/action.entity';
import { ActionsService } from '@121-service/src/actions/actions.service';
import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { PaymentsExecutionHelperService } from '@121-service/src/payments/services/payments-execution-helper.service';
import { PaymentsProgressHelperService } from '@121-service/src/payments/services/payments-progress.helper.service';
import { PaymentsReportingService } from '@121-service/src/payments/services/payments-reporting.service';
import { TransactionJobsCreationService } from '@121-service/src/payments/services/transaction-jobs-creation.service';
import { TransactionViewScopedRepository } from '@121-service/src/payments/transactions/repositories/transaction.view.scoped.repository';
import { BulkActionResultRetryPaymentDto } from '@121-service/src/registration/dto/bulk-action-result.dto';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';

@Injectable()
export class PaymentsExecutionService {
  public constructor(
    private readonly actionService: ActionsService,
    private readonly azureLogService: AzureLogService,
    private readonly transactionViewScopedRepository: TransactionViewScopedRepository,
    private readonly transactionJobsCreationService: TransactionJobsCreationService,
    private readonly paymentsProgressHelperService: PaymentsProgressHelperService,
    private readonly paymentsExecutionHelperService: PaymentsExecutionHelperService,
    private readonly paymentsReportingService: PaymentsReportingService,
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
    // ##TODO put this here? What to do with actions?
    await this.paymentsProgressHelperService.checkPaymentInProgressAndThrow(
      programId,
    );

    const transactions =
      await this.paymentsReportingService.getTransactionsByPaymentId({
        programId,
        paymentId,
      });

    await this.paymentsExecutionHelperService.updatePaymentCountAndSetToCompleted(
      {
        registrationIds: transactions.map((t) => t.registrationId),
        programId,
        userId,
      },
    );

    await this.createTransactionJobs({
      programId,
      transactionIds: transactions.map((t) => t.id),
      userId,
      isRetry: false,
    });
  }

  public async retryPayment(
    userId: number,
    programId: number,
    paymentId: number,
    referenceIds?: string[],
  ): Promise<BulkActionResultRetryPaymentDto> {
    await this.paymentsProgressHelperService.checkPaymentInProgressAndThrow(
      programId,
    );

    const transactionDetails = await this.getRetryTransactionDetailsOrThrow({
      programId,
      paymentId,
      inputReferenceIds: referenceIds,
    });

    await this.actionService.saveAction(
      userId,
      programId,
      AdditionalActionType.paymentStarted,
    );

    void this.createTransactionJobs({
      programId,
      transactionIds: transactionDetails.map((t) => t.transactionId),
      userId,
      isRetry: true,
    })
      .catch((e) => {
        this.azureLogService.logError(e, true);
      })
      .finally(() => {
        void this.actionService.saveAction(
          userId,
          programId,
          AdditionalActionType.paymentFinished,
        );
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
