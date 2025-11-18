import { Inject, Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { FspConfigurationProperties } from '@121-service/src/fsps/enums/fsp-name.enum';
import { OnafriqTransactionEntity } from '@121-service/src/payments/fsp-integration/onafriq/entities/onafriq-transaction.entity';
import { OnafriqApiResponseStatusType } from '@121-service/src/payments/fsp-integration/onafriq/enum/onafriq-api-response-status-type.enum';
import { OnafriqError } from '@121-service/src/payments/fsp-integration/onafriq/errors/onafriq.error';
import { OnafriqService } from '@121-service/src/payments/fsp-integration/onafriq/services/onafriq.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventCreationContext } from '@121-service/src/payments/transactions/transaction-events/interfaces/transaction-event-creation-context.interfac';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { SaveTransactionProgressAndUpdateRegistrationContext } from '@121-service/src/transaction-jobs/interfaces/save-transaction-progress-and-update-registration-context.interface';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';
import { OnafriqTransactionJobDto } from '@121-service/src/transaction-queues/dto/onafriq-transaction-job.dto';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';
import { generateUUIDFromSeed } from '@121-service/src/utils/uuid.helpers';

@Injectable()
export class TransactionJobsOnafriqService {
  constructor(
    private readonly onafriqService: OnafriqService,
    @Inject(getScopedRepositoryProviderName(OnafriqTransactionEntity))
    private readonly onafriqTransactionScopedRepository: ScopedRepository<OnafriqTransactionEntity>,
    private readonly transactionJobsHelperService: TransactionJobsHelperService,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly transactionEventScopedRepository: TransactionEventsScopedRepository,
  ) {}

  public async processOnafriqTransactionJob(
    transactionJob: OnafriqTransactionJobDto,
  ): Promise<void> {
    const transactionEventContext: TransactionEventCreationContext = {
      transactionId: transactionJob.transactionId,
      userId: transactionJob.userId,
      programFspConfigurationId: transactionJob.programFspConfigurationId,
    };

    // 1. Create transaction event 'initiated' or 'retry'
    await this.transactionJobsHelperService.createInitiatedOrRetryTransactionEvent(
      {
        context: transactionEventContext,
        isRetry: transactionJob.isRetry,
      },
    );

    // 2. Create idempotency key
    const failedTransactionAttempts =
      await this.transactionEventScopedRepository.countFailedTransactionAttempts(
        transactionJob.transactionId,
      );
    // thirdPartyTransId is generated using: (referenceId + transactionId + failedTransactionAttempts)
    // Using this count to generate the thirdPartyTransId ensures that on:
    // a. Payment retry, a new thirdPartyTransId is generated, which will not be blocked by Onafriq API, as desired.
    // b. Queue retry: on queue retry, the same thirdPartyTransId is generated, which will be blocked by Onafriq API, as desired.
    const thirdPartyTransId = generateUUIDFromSeed(
      `ReferenceId=${transactionJob.referenceId},TransactionId=${transactionJob.transactionId},Attempt=${failedTransactionAttempts}`,
    );

    // 3. Create or update Onafriq Transaction with thirdPartyTransId
    await this.upsertOnafriqTransaction(thirdPartyTransId, transactionJob);

    // 4. Start the transaction, if failure: update to error transaction and return early
    const saveTransactionProgressAndUpdateRegistrationContext: SaveTransactionProgressAndUpdateRegistrationContext =
      {
        transactionEventContext,
        programId: transactionJob.programId,
        referenceId: transactionJob.referenceId,
        isRetry: transactionJob.isRetry,
      };
    try {
      const requestIdentity = await this.getOnafriqFspConfig(
        transactionJob.programFspConfigurationId,
      );
      await this.onafriqService.createTransaction({
        transferValue: transactionJob.transferValue,
        phoneNumberPayment: transactionJob.phoneNumberPayment,
        firstName: transactionJob.firstName,
        lastName: transactionJob.lastName,
        thirdPartyTransId,
        requestIdentity,
      });
    } catch (error) {
      if (
        error instanceof OnafriqError &&
        error.type ===
          OnafriqApiResponseStatusType.duplicateThirdPartyTransIdError
      ) {
        // Return early, as this job re-attempt has already been processed before, which should not be overwritten
        console.error(error.message);
        return;
      } else if (error instanceof OnafriqError) {
        // store error transactionEvent and update transaction to 'error'
        await this.transactionJobsHelperService.saveTransactionProgressAndUpdateRegistration(
          {
            context: saveTransactionProgressAndUpdateRegistrationContext,
            description: TransactionEventDescription.onafriqRequestSent,
            errorMessage: error.message,
            newTransactionStatus: TransactionStatusEnum.error,
          },
        );
        return;
      } else {
        throw error;
      }
    }

    // 5. store success transactionEvent and update transaction to 'waiting'
    await this.transactionJobsHelperService.saveTransactionProgressAndUpdateRegistration(
      {
        context: saveTransactionProgressAndUpdateRegistrationContext,
        description: TransactionEventDescription.onafriqRequestSent,
        newTransactionStatus: TransactionStatusEnum.waiting, // This will only go to 'success' via callback
      },
    );
  }

  private async upsertOnafriqTransaction(
    thirdPartyTransId: string,
    transactionJob: OnafriqTransactionJobDto,
  ): Promise<void> {
    // Check for existing Onafriq Transactions with the same transactionId
    const existingOnafriqTransaction =
      await this.onafriqTransactionScopedRepository.findOne({
        where: {
          transactionId: Equal(transactionJob.transactionId),
        },
      });

    // .. if found (implies: payment-retry or queue-retry), update existing Onafriq Transaction with thirdPartyTransId. In case of queue-retry the thirdPartyTransId is the same, so the update is not needed. But this leads to easier code.
    if (existingOnafriqTransaction) {
      await this.onafriqTransactionScopedRepository.update(
        {
          id: existingOnafriqTransaction.id,
        },
        {
          thirdPartyTransId,
        },
      );
      return;
    }

    // .. if not found, create new Onafriq Transaction
    const newOnafriqTransaction = new OnafriqTransactionEntity();
    newOnafriqTransaction.thirdPartyTransId = thirdPartyTransId;
    newOnafriqTransaction.recipientMsisdn = transactionJob.phoneNumberPayment;
    newOnafriqTransaction.transactionId = transactionJob.transactionId;
    await this.onafriqTransactionScopedRepository.save(newOnafriqTransaction);
  }

  private async getOnafriqFspConfig(
    programFspConfigurationId: number,
  ): Promise<{
    corporateCode: string;
    password: string;
    uniqueKey: string;
  }> {
    const programFspConfigProperties =
      await this.programFspConfigurationRepository.getPropertiesByNamesOrThrow({
        programFspConfigurationId,
        names: [
          FspConfigurationProperties.corporateCodeOnafriq,
          FspConfigurationProperties.passwordOnafriq,
          FspConfigurationProperties.uniqueKeyOnafriq,
        ],
      });
    return {
      corporateCode: programFspConfigProperties.find(
        (c) => c.name === FspConfigurationProperties.corporateCodeOnafriq,
      )?.value as string,
      password: programFspConfigProperties.find(
        (c) => c.name === FspConfigurationProperties.passwordOnafriq,
      )?.value as string,
      uniqueKey: programFspConfigProperties.find(
        (c) => c.name === FspConfigurationProperties.uniqueKeyOnafriq,
      )?.value as string,
    };
  }
}
