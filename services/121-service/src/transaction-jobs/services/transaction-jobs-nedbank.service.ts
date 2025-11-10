import { Injectable } from '@nestjs/common';

import { NedbankVoucherStatus } from '@121-service//src/payments/fsp-integration/nedbank/enums/nedbank-voucher-status.enum';
import { env } from '@121-service/src/env';
import { FspConfigurationProperties } from '@121-service/src/fsps/enums/fsp-name.enum';
import { NedbankError } from '@121-service/src/payments/fsp-integration/nedbank/errors/nedbank.error';
import { NedbankVoucherScopedRepository } from '@121-service/src/payments/fsp-integration/nedbank/repositories/nedbank-voucher.scoped.repository';
import { NedbankService } from '@121-service/src/payments/fsp-integration/nedbank/services/nedbank.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { SaveTransactionProgressAndRelatedDataContext } from '@121-service/src/transaction-jobs/interfaces/save-transaction-progress-and-related-data-context.interface';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';
import { NedbankTransactionJobDto } from '@121-service/src/transaction-queues/dto/nedbank-transaction-job.dto';
import { generateUUIDFromSeed } from '@121-service/src/utils/uuid.helpers';

@Injectable()
export class TransactionJobsNedbankService {
  constructor(
    private readonly nedbankService: NedbankService,
    private readonly nedbankVoucherScopedRepository: NedbankVoucherScopedRepository,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly transactionJobsHelperService: TransactionJobsHelperService,
    private readonly transactionEventScopedRepository: TransactionEventsScopedRepository,
    private readonly transactionsService: TransactionsService,
  ) {}

  public async processNedbankTransactionJob(
    transactionJob: NedbankTransactionJobDto,
  ): Promise<void> {
    const transactionEventContext: SaveTransactionProgressAndRelatedDataContext =
      {
        transactionId: transactionJob.transactionId,
        userId: transactionJob.userId,
        programFspConfigurationId: transactionJob.programFspConfigurationId,
        programId: transactionJob.programId,
        referenceId: transactionJob.referenceId,
      };

    // Create transaction event 'initiated' or 'retry'
    await this.transactionJobsHelperService.createInitiatedOrRetryTransactionEvent(
      {
        context: transactionEventContext,
        isRetry: transactionJob.isRetry,
      },
    );

    // Set the payment reference
    const paymentReference = await this.createPaymentReference({
      programFspConfigurationId: transactionJob.programFspConfigurationId,
      phoneNumber: transactionJob.phoneNumber,
    });

    // Check if there is an existing voucher/orderCreateReference without status if not create orderCreateReference, the nedbank voucher and the related transaction
    // This should almost never happen, only when we have a server crash or when we got a timeout from the nedbank API when creating the order
    // but if it does, we should use the same orderCreateReference to avoid creating a new voucher
    let orderCreateReference: string;
    const transactionId = transactionJob.transactionId;
    const voucherWithoutStatus =
      await this.nedbankVoucherScopedRepository.getVoucherWhereStatusNull({
        transactionId: transactionJob.transactionId,
      });

    if (voucherWithoutStatus) {
      orderCreateReference = voucherWithoutStatus.orderCreateReference;
    } else {
      // Update transaction status to waiting, this is to ensure that this transactions is not retried as we are about to create the voucher
      // If this job fails after this point due to a timout from nedbank the reconciliation process will pick it up and set it to success or error, so it can be retried if needed
      // ##TODO should this already lead to paymentCount/completed update?
      await this.transactionsService.updateTransactionStatus({
        transactionId: transactionJob.transactionId,
        status: TransactionStatusEnum.waiting,
      });

      // Get count of failed transactions to create orderCreateReference
      const failedTransactionAttempts =
        await this.transactionEventScopedRepository.countFailedTransactionAttempts(
          transactionJob.transactionId,
        );
      // orderCreateReference is generated using: (referenceId + transactionId + current failed transactions)
      // Using this count to generate the OrderReferenceId ensures that:
      // a. On payment retry, a new reference is generated (needed because a new reference is required by nedbank if a failed order was created).
      // b. Queue Retry: on queue retry, the same OrderReferenceId is generated, which is beneficial because the old successful/failed Order response would be returned.
      orderCreateReference = generateUUIDFromSeed(
        `ReferenceId=${transactionJob.referenceId},TransactionId=${transactionId},Attempt=${failedTransactionAttempts}`,
      ).replace(/^(.{14})5/, '$14');

      // THIS IS MOCK FUNCTIONALITY FOR TESTING PURPOSES ONLY
      if (env.MOCK_NEDBANK && transactionJob.referenceId.includes('mock')) {
        // If mock, add the referenceId to the orderCreateReference
        // This way you can add one of the Nedbank voucher statuses to the orderCreateReference
        // to simulate a specific statuses in responses from the Nedbank API on getOrderByOrderCreateReference
        orderCreateReference = `${transactionJob.referenceId}-${orderCreateReference}`;
      }

      // Store the nedbank voucher with status null (as we don't know the status yet)
      // For payment retry or queue retry we need to reuse the existing voucher attached the the transaction
      // (For queue retry voucherstatus should already be null)
      await this.nedbankVoucherScopedRepository.upsertVoucherByTransactionId({
        paymentReference,
        orderCreateReference,
        transactionId,
        voucherStatus: null,
      });
    }

    // Create the voucher via Nedbank API and update the transaction if an error occurs
    // Updating the transaction on succesfull voucher creation is not needed as it is already in the 'waiting' state
    // and will be updated to success (or error) via the reconciliation process
    let nedbankVoucherStatus: NedbankVoucherStatus;
    try {
      nedbankVoucherStatus = await this.nedbankService.createVoucher({
        transferValue: transactionJob.transferValue,
        phoneNumber: transactionJob.phoneNumber,
        orderCreateReference,
        paymentReference,
      });
    } catch (error) {
      if (error instanceof NedbankError) {
        // Update the status to failed so we don't try to create the voucher again
        // NedbankVoucherStatus.FAILED is introduced to differentiate between
        // a) a voucher that failed to be created, while we got a response from Nedbank and b) a voucher of which the status is unknown due to a timout/server crash
        await this.nedbankVoucherScopedRepository.update(
          { orderCreateReference },
          { status: NedbankVoucherStatus.FAILED },
        );

        // Update the transaction to error, so it won't be picked up by the reconciliation process
        await this.transactionJobsHelperService.saveTransactionProgressAndUpdateRelatedData(
          {
            context: transactionEventContext,
            description:
              TransactionEventDescription.nedbankVoucherCreationRequested,
            errorMessage: error?.message,
            newTransactionStatus: TransactionStatusEnum.error,
          },
        );
        return;
      } else {
        throw error;
      }
    }

    // 4. Store the status of the nedbank voucher
    await this.nedbankVoucherScopedRepository.update(
      { orderCreateReference },
      { status: nedbankVoucherStatus },
    );

    await this.transactionJobsHelperService.saveTransactionProgressAndUpdateRelatedData(
      {
        context: transactionEventContext,
        description:
          TransactionEventDescription.nedbankVoucherCreationRequested,
        newTransactionStatus: TransactionStatusEnum.waiting, // This will only go to 'success' via callback
      },
    );
  }

  /**
   * Generates a unique, human-readable payment reference for each transaction.
   *
   * This reference will be shown on the bank statement which the user receives by Nedbank out of the 121-platform.
   * It's therefore a human readable identifier, which is unique for each transaction and can be related to the registration and transaction manually.
   * Payment reference cannot be longer than 30 characters.
   * All non-alphanumeric characters (except hyphens) are removed because the Nedbank API does not accept them.
   */
  private async createPaymentReference({
    programFspConfigurationId,
    phoneNumber,
  }: {
    programFspConfigurationId: number;
    phoneNumber: string;
  }): Promise<string> {
    // This is a unique identifier for each transaction, which will be shown on the bank statement which the user receives by Nedbank out of the 121-platform
    // It's therefore a human readable identifier, which is unique for each transaction and can be related to the registration and transaction manually
    // Payment reference cannot be longer than 30 characters
    const paymentReferencePrefix =
      (await this.programFspConfigurationRepository.getPropertyValueByName({
        programFspConfigurationId,
        name: FspConfigurationProperties.paymentReferencePrefix,
      })) as string; // This must be a string. If it is undefined the validation in payment service should have caught it. If a user set it as an array string you should get an internal server error here, this seems like an edge case;
    const sanitizedPaymentReferencePrefix = paymentReferencePrefix.replace(
      /[^a-zA-Z0-9-]/g,
      '',
    ); // All non-alphanumeric characters (except hyphens) are removed because the nedbank API does not accept them
    return `${sanitizedPaymentReferencePrefix.slice(0, 18)}-${phoneNumber}`;
  }
}
