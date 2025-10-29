import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { ActionsService } from '@121-service/src/actions/actions.service';
import { ActionType } from '@121-service/src/actions/enum/action-type.enum';
import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { PaymentEvent } from '@121-service/src/payments/payment-events/enums/payment-event.enum';
import { PaymentEventsService } from '@121-service/src/payments/payment-events/payment-events.service';
import { PaymentsExecutionHelperService } from '@121-service/src/payments/services/payments-execution-helper.service';
import { PaymentsHelperService } from '@121-service/src/payments/services/payments-helper.service';
import { PaymentsProgressHelperService } from '@121-service/src/payments/services/payments-progress.helper.service';
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
    // check in-progress and set to in-progress
    await this.paymentsProgressHelperService.checkPaymentInProgressAndThrow(
      programId,
    );
    await this.actionService.saveAction(
      userId,
      programId,
      ActionType.startBlockNewPayment,
    );

    // do all operations in a try to make sure we always end with an unblock-payments action, also in case of failure
    try {
      const transactionsOfIncludedRegistrations =
        await this.transactionViewScopedRepository.getTransactionsOfIncludedRegistrationsByPaymentId(
          {
            programId,
            paymentId,
          },
        );

      const programFspConfigurationNames: string[] =
        transactionsOfIncludedRegistrations
          .map((t) => t.programFspConfigurationName)
          .filter((fsp) => fsp !== null);
      await this.paymentsHelperService.checkFspConfigurationsOrThrow(
        programId,
        programFspConfigurationNames,
      );

      await this.paymentEventsService.createEventWithoutAttributes({
        paymentId,
        userId,
        type: PaymentEvent.started,
      });

      await this.paymentsExecutionHelperService.updatePaymentCountAndSetToCompleted(
        {
          registrationIds: transactionsOfIncludedRegistrations.map(
            (t) => t.registrationId,
          ),
          programId,
          userId,
        },
      );

      void this.createTransactionJobs({
        programId,
        transactionIds: transactionsOfIncludedRegistrations.map((t) => t.id),
        userId,
        isRetry: false,
      });
    } finally {
      await this.actionService.saveAction(
        userId,
        programId,
        ActionType.endBlockNewPayment,
      );
    }
  }

  public async retryPayment(
    userId: number,
    programId: number,
    paymentId: number,
    referenceIds?: string[],
  ): Promise<BulkActionResultRetryPaymentDto> {
    // check in-progress and set to in-progress
    await this.paymentsProgressHelperService.checkPaymentInProgressAndThrow(
      programId,
    );
    await this.actionService.saveAction(
      userId,
      programId,
      ActionType.startBlockNewPayment,
    );

    let transactionDetails: {
      transactionId: number;
      programFspConfigurationName: string;
    }[];
    // do all operations UP TO starting the queue in a try, so that we can always end with a unblock-payments action, also in case of failure
    // from the moment of starting the queue the in-progress checking is taken over by the queue
    try {
      transactionDetails = await this.getRetryTransactionDetailsOrThrow({
        programId,
        paymentId,
        inputReferenceIds: referenceIds,
      });

      void this.createTransactionJobs({
        programId,
        transactionIds: transactionDetails.map((t) => t.transactionId),
        userId,
        isRetry: true,
      });
    } finally {
      void this.actionService.saveAction(
        userId,
        programId,
        ActionType.endBlockNewPayment,
      );
    }

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
