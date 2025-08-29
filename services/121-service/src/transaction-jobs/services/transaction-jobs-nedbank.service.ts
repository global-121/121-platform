import { Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { NedbankVoucherStatus } from '@121-service//src/payments/fsp-integration/nedbank/enums/nedbank-voucher-status.enum';
import { env } from '@121-service/src/env';
import { FspConfigurationProperties } from '@121-service/src/fsps/enums/fsp-name.enum';
import { NedbankError } from '@121-service/src/payments/fsp-integration/nedbank/errors/nedbank.error';
import { NedbankVoucherScopedRepository } from '@121-service/src/payments/fsp-integration/nedbank/repositories/nedbank-voucher.scoped.repository';
import { NedbankService } from '@121-service/src/payments/fsp-integration/nedbank/services/nedbank.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.scoped.repository';
import { ProjectFspConfigurationRepository } from '@121-service/src/project-fsp-configurations/project-fsp-configurations.repository';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';
import { NedbankTransactionJobDto } from '@121-service/src/transaction-queues/dto/nedbank-transaction-job.dto';
import { generateUUIDFromSeed } from '@121-service/src/utils/uuid.helpers';

@Injectable()
export class TransactionJobsNedbankService {
  constructor(
    private readonly nedbankService: NedbankService,
    private readonly nedbankVoucherScopedRepository: NedbankVoucherScopedRepository,
    private readonly transactionScopedRepository: TransactionScopedRepository,
    private readonly projectFspConfigurationRepository: ProjectFspConfigurationRepository,
    private readonly transactionJobsHelperService: TransactionJobsHelperService,
  ) {}

  public async processNedbankTransactionJob(
    transactionJob: NedbankTransactionJobDto,
  ): Promise<void> {
    // 1. Get the registration to log changes to it later in event table
    const registration =
      await this.transactionJobsHelperService.getRegistrationOrThrow(
        transactionJob.referenceId,
      );

    // 2. Set the payment reference
    const paymentReference = await this.createPaymentReference({
      projectFspConfigurationId: transactionJob.projectFspConfigurationId,
      phoneNumber: transactionJob.phoneNumber,
    });

    // 3. Check if there is an existing voucher/orderCreateReference without status if not create orderCreateReference, the nedbank voucher and the related transaction
    // This should almost never happen, only when we have a server crash or when we got a timeout from the nedbank API when creating the order
    // but if it does, we should use the same orderCreateReference to avoid creating a new voucher
    let orderCreateReference: string;
    let transactionId: number;
    const voucherWithoutStatus =
      await this.nedbankVoucherScopedRepository.getVoucherWhereStatusNull({
        paymentId: transactionJob.paymentId,
        registrationId: registration.id,
      });

    if (voucherWithoutStatus) {
      orderCreateReference = voucherWithoutStatus.orderCreateReference;
      transactionId = voucherWithoutStatus.transactionId;
    } else {
      // Create transaction and update registration
      // Note: The transaction is created before the voucher is created, so it can be linked to the generated orderCreateReference
      // before the create voucher order API call to Nedbank is made
      const transaction =
        await this.transactionJobsHelperService.createTransactionAndUpdateRegistration(
          {
            registration,
            transactionJob,
            transferAmountInMajorUnit: transactionJob.transactionAmount,
            status: TransactionStatusEnum.waiting,
          },
        );
      transactionId = transaction.id;

      // Get count of failed transactions to create orderCreateReference
      const failedTransactionsCount =
        await this.transactionScopedRepository.count({
          where: {
            registrationId: Equal(registration.id),
            paymentId: Equal(transactionJob.paymentId),
            status: Equal(TransactionStatusEnum.error),
          },
        });
      // orderCreateReference is generated using: (referenceId + paymentId + current failed transactions)
      // Using this count to generate the OrderReferenceId ensures that:
      // a. On payment retry, a new reference is generated (needed because a new reference is required by nedbank if a failed order was created).
      // b. Queue Retry: on queue retry, the same OrderReferenceId is generated, which is beneficial because the old successful/failed Order response would be returned.
      orderCreateReference = generateUUIDFromSeed(
        `ReferenceId=${transactionJob.referenceId},PaymentNumber=${transactionJob.paymentId},Attempt=${failedTransactionsCount}`,
      ).replace(/^(.{14})5/, '$14');

      // THIS IS MOCK FUNCTIONONALITY FOR TESTING PURPOSES ONLY
      if (env.MOCK_NEDBANK && transactionJob.referenceId.includes('mock')) {
        // If mock, add the referenceId to the orderCreateReference
        // This way you can add one of the nedbank voucher statusses to the orderCreateReference
        // to simulate a specific statusses in responses from the nedbank API on getOrderByOrderCreateReference
        orderCreateReference = `${transactionJob.referenceId}-${orderCreateReference}`;
      }

      await this.nedbankVoucherScopedRepository.storeVoucher({
        paymentReference,
        orderCreateReference,
        transactionId,
      });
    }

    // 3. Create the voucher via Nedbank API and update the transaction if an error occurs
    // Updating the transaction on succesfull voucher creation is not needed as it is already in the 'waiting' state
    // and will be updated to success (or error) via the reconciliation process
    let nedbankVoucherStatus: NedbankVoucherStatus;
    try {
      nedbankVoucherStatus = await this.nedbankService.createVoucher({
        transferAmount: transactionJob.transactionAmount,
        phoneNumber: transactionJob.phoneNumber,
        orderCreateReference,
        paymentReference,
      });
    } catch (error) {
      if (error instanceof NedbankError) {
        nedbankVoucherStatus = NedbankVoucherStatus.FAILED;
        await this.transactionScopedRepository.update(
          { id: transactionId },
          { status: TransactionStatusEnum.error, errorMessage: error?.message },
        );
        // Update the status to failed so we don't try to create the voucher again
        // NedbankVoucherStatus.FAILED is introduced to differentiate between
        // a) a voucher that failed to be created, while we got a response from nedbbank and b) a voucher of which the status is unknown due to a timout/server crash
      } else {
        throw error;
      }
    }

    // 4. Store the status of the nedbank voucher
    await this.nedbankVoucherScopedRepository.update(
      { orderCreateReference },
      { status: nedbankVoucherStatus },
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
    projectFspConfigurationId,
    phoneNumber,
  }: {
    projectFspConfigurationId: number;
    phoneNumber: string;
  }): Promise<string> {
    // This is a unique identifier for each transaction, which will be shown on the bank statement which the user receives by Nedbank out of the 121-platform
    // It's therefore a human readable identifier, which is unique for each transaction and can be related to the registration and transaction manually
    // Payment reference cannot be longer than 30 characters
    const paymentReferencePrefix =
      (await this.projectFspConfigurationRepository.getPropertyValueByName({
        projectFspConfigurationId,
        name: FspConfigurationProperties.paymentReferencePrefix,
      })) as string; // This must be a string. If it is undefined the validation in payment service should have caught it. If a user set it as an array string you should get an internal server error here, this seems like an edge case;
    const sanitizedPaymentReferencePrefix = paymentReferencePrefix.replace(
      /[^a-zA-Z0-9-]/g,
      '',
    ); // All non-alphanumeric characters (except hyphens) are removed because the nedbank API does not accept them
    return `${sanitizedPaymentReferencePrefix.slice(0, 18)}-${phoneNumber}`;
  }
}
