import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginateQuery } from 'nestjs-paginate';
import { Equal, Repository } from 'typeorm';

import { AdditionalActionType } from '@121-service/src/actions/action.entity';
import { ActionsService } from '@121-service/src/actions/actions.service';
import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { getFspConfigurationRequiredProperties } from '@121-service/src/fsps/fsp-settings.helpers';
import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';
import {
  PaymentJobCreationDetails,
  PaymentJobCreationDetailsBase,
} from '@121-service/src/payments/interfaces/payment-job-creation-details.interface';
import { RetryPaymentJobCreationDetails } from '@121-service/src/payments/interfaces/retry-payment-job-creation-details.interface';
import { PaymentEventsService } from '@121-service/src/payments/payment-events/payment-events.service';
import { PaymentsProgressHelperService } from '@121-service/src/payments/services/payments-progress.helper.service';
import { TransactionJobsCreationService } from '@121-service/src/payments/services/transaction-jobs-creation.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import {
  BulkActionResultPaymentDto,
  BulkActionResultRetryPaymentDto,
} from '@121-service/src/registration/dto/bulk-action-result.dto';
import { RegistrationViewEntity } from '@121-service/src/registration/entities/registration-view.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { ScopedQueryBuilder } from '@121-service/src/scoped.repository';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';

@Injectable()
export class PaymentsExecutionService {
  @InjectRepository(PaymentEntity)
  private readonly paymentRepository: Repository<PaymentEntity>;

  public constructor(
    private readonly actionService: ActionsService,
    private readonly azureLogService: AzureLogService,
    private readonly transactionsService: TransactionsService,
    private readonly registrationsBulkService: RegistrationsBulkService,
    private readonly registrationsPaginationService: RegistrationsPaginationService,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly paymentEventsService: PaymentEventsService,
    private readonly transactionJobsCreationService: TransactionJobsCreationService,
    private readonly paymentsProgressHelperService: PaymentsProgressHelperService,
    private readonly registrationScopedRepository: RegistrationScopedRepository,
  ) {}

  public async createPayment({
    userId,
    programId,
    amount,
    query,
    dryRun,
    note,
  }: {
    userId: number;
    programId: number;
    amount: number | undefined;
    query: PaginateQuery;
    dryRun: boolean;
    note?: string;
  }): Promise<BulkActionResultPaymentDto> {
    if (!dryRun) {
      await this.paymentsProgressHelperService.checkPaymentInProgressAndThrow(
        programId,
      );
    }

    // TODO: REFACTOR: Move what happens in setQueryPropertiesBulkAction into this function, and call a refactored version of getBulkActionResult/getPaymentBaseQuery (create solution design first)
    const paginateQuery =
      this.registrationsBulkService.setQueryPropertiesBulkAction({
        query,
        includePaymentAttributes: true,
      });

    // Fill bulkActionResultDto with meta data of the payment being done
    const bulkActionResultDto =
      await this.registrationsBulkService.getBulkActionResult(
        paginateQuery,
        programId,
        this.getPaymentBaseQuery(), // We need to create a separate queryBuilder object twice or it will be modified twice
      );

    // If amount is not defined do not calculate the totalMultiplierSum
    // This happens when you call the endpoint with dryRun=true
    // Calling with dryrun is true happens in the pa table when you try to do a payment to decide which registrations are selectable
    if (!amount) {
      return {
        ...bulkActionResultDto,
        sumPaymentAmountMultiplier: 0,
        programFspConfigurationNames: [],
      };
    }

    // Get array of RegistrationViewEntity objects to be paid
    const registrationsForPayment =
      await this.getRegistrationsForPaymentChunked(programId, paginateQuery);

    // Calculate the totalMultiplierSum and create an array with all FSPs for this payment
    // Get the sum of the paymentAmountMultiplier of all registrations to calculate the total amount of money to be paid in frontend
    let totalMultiplierSum = 0;
    // This loop is pretty fast: with 131k registrations it takes ~38ms

    for (const registration of registrationsForPayment) {
      totalMultiplierSum =
        totalMultiplierSum + registration.paymentAmountMultiplier;
      // This is only needed in actual doPayment call
    }

    // Get unique programFspConfigurationNames in payment
    // Getting unique programFspConfigurationNames is relatively: with 131k registrations it takes ~36ms locally
    const programFspConfigurationNames = Array.from(
      new Set(
        registrationsForPayment.map(
          (registration) => registration.programFspConfigurationName,
        ),
      ),
    );

    // Fill bulkActionResultPaymentDto with bulkActionResultDto and additional payment specific data
    const bulkActionResultPaymentDto: BulkActionResultPaymentDto = {
      ...bulkActionResultDto,
      sumPaymentAmountMultiplier: totalMultiplierSum,
      programFspConfigurationNames,
    };

    // Create an array of referenceIds to be paid
    const referenceIds = registrationsForPayment.map(
      (registration) => registration.referenceId,
    );

    if (!dryRun && referenceIds.length > 0) {
      await this.checkFspConfigurationsOrThrow(
        programId,
        programFspConfigurationNames,
      );
      const paymentId = await this.createPaymentAndEventsEntities({
        userId,
        programId,
        note,
      });
      bulkActionResultPaymentDto.id = paymentId;
      // TODO: REFACTOR: userId not be passed down, but should be available in a context object; registrationsForPayment.length is redundant, as it is the same as referenceIds.length
      void this.initiatePayment({
        userId,
        programId,
        paymentId,
        amount,
        referenceIds,
      })
        .catch((e) => {
          this.azureLogService.logError(e, true);
        })
        .finally(() => {
          // Remove this
          void this.actionService.saveAction(
            userId,
            programId,
            AdditionalActionType.paymentFinished,
          );
        });
    }
    return bulkActionResultPaymentDto;
  }

  private async createPaymentAndEventsEntities({
    userId,
    programId,
    note,
  }: {
    userId: number;
    programId: number;
    note?: string;
  }): Promise<number> {
    const paymentEntity = new PaymentEntity();
    paymentEntity.programId = programId;
    const savedPaymentEntity = await this.paymentRepository.save(paymentEntity);

    await this.paymentEventsService.createCreatedEvent({
      paymentId: savedPaymentEntity.id,
      userId,
    });

    if (note) {
      await this.paymentEventsService.createNoteEvent({
        paymentId: savedPaymentEntity.id,
        userId,
        note,
      });
    }

    return savedPaymentEntity.id;
  }

  private async createTransactionAndEventEntities({
    userId,
    programId,
    paymentId,
    paymentJobCreationDetails,
  }: {
    userId: number;
    programId: number;
    paymentId: number;
    paymentJobCreationDetails: PaymentJobCreationDetails[];
  }): Promise<PaymentJobCreationDetails[]> {
    const transactionByRegistrationIdMap =
      await this.transactionsService.createTransactionAndUpdateRegistrationBulk(
        {
          paymentJobCreationDetails,
          programId,
          paymentId,
          userId,
          isRetry: false,
        },
      );
    for (const item of paymentJobCreationDetails) {
      const transactionId = transactionByRegistrationIdMap.get(
        item.registrationId,
      );
      item.transactionId = transactionId;
    }
    return paymentJobCreationDetails;
  }

  private async checkFspConfigurationsOrThrow(
    programId: number,
    programFspConfigurationNames: string[],
  ): Promise<void> {
    const validationResults = await Promise.all(
      programFspConfigurationNames.map((name) =>
        this.validateMissingFspConfigurations(programId, name),
      ),
    );
    const errorMessages = validationResults.flat();
    if (errorMessages.length > 0) {
      throw new HttpException(
        `${errorMessages.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async validateMissingFspConfigurations(
    programId: number,
    programFspConfigurationName: string,
  ): Promise<string[]> {
    const config = await this.programFspConfigurationRepository.findOne({
      where: {
        name: Equal(programFspConfigurationName),
        programId: Equal(programId),
      },
      relations: ['properties'],
    });

    const errorMessages: string[] = [];
    if (!config) {
      errorMessages.push(
        `Missing Program FSP configuration with name ${programFspConfigurationName}`,
      );
      return errorMessages;
    }

    const requiredConfigurations = getFspConfigurationRequiredProperties(
      config.fspName,
    );
    // Early return for FSP that don't have required configurations
    if (!requiredConfigurations) {
      return [];
    }

    for (const requiredConfiguration of requiredConfigurations) {
      const foundConfig = config.properties.find(
        (c) => c.name === requiredConfiguration,
      );
      if (!foundConfig) {
        errorMessages.push(
          `Missing required configuration ${requiredConfiguration} for FSP ${config.fspName}`,
        );
      }
    }

    return errorMessages;
  }

  private async getRegistrationsForPaymentChunked(
    programId: number,
    paginateQuery: PaginateQuery,
  ) {
    const chunkSize = 4000;

    return await this.registrationsPaginationService.getRegistrationViewsChunkedByPaginateQuery(
      programId,
      paginateQuery,
      chunkSize,
      this.getPaymentBaseQuery(),
    );
  }

  private getPaymentBaseQuery(): ScopedQueryBuilder<RegistrationViewEntity> {
    return this.registrationsBulkService
      .getBaseQuery()
      .andWhere('registration.status = :status', {
        status: RegistrationStatusEnum.included,
      });
  }

  public async initiatePayment({
    userId,
    programId,
    paymentId,
    amount,
    referenceIds,
  }: {
    userId: number;
    programId: number;
    paymentId: number;
    amount: number;
    referenceIds: string[];
  }): Promise<void> {
    await this.actionService.saveAction(
      userId,
      programId,
      AdditionalActionType.paymentStarted,
    );

    // Get the registration data for the payment (like phone number, bankaccountNumber etc)
    const paymentJobCreationDetails = await this.getPaymentJobCreationDetails({
      referenceIds,
      amount,
      programId,
    });

    const paymentJobCreationDetailsWithTransactionId =
      await this.createTransactionAndEventEntities({
        userId,
        programId,
        paymentId,
        paymentJobCreationDetails,
      });

    await this.createTransactionJobs({
      paymentJobCreationDetails: paymentJobCreationDetailsWithTransactionId,
      programId,
      paymentId,
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

    const retryDetailsList =
      await this.getRetryPaymentJobCreationDetailsOrThrow({
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
      paymentJobCreationDetails: retryDetailsList,
      programId,
      paymentId,
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
    for (const registration of retryDetailsList) {
      if (
        !programFspConfigurationNames.includes(
          registration.programFspConfigurationName,
        )
      ) {
        programFspConfigurationNames.push(
          registration.programFspConfigurationName,
        );
      }
    }

    return {
      totalFilterCount: retryDetailsList.length,
      applicableCount: retryDetailsList.length,
      nonApplicableCount: 0,
      programFspConfigurationNames,
    };
  }

  public async createTransactionJobs({
    paymentJobCreationDetails,
    programId,
    userId,
    isRetry = false,
  }: {
    paymentJobCreationDetails: PaymentJobCreationDetailsBase[];
    programId: number;
    paymentId: number;
    userId: number;
    isRetry?: boolean;
  }): Promise<void> {
    for (const fspName of Object.values(Fsps)) {
      const paymentJobCreationDetailsForFsp = paymentJobCreationDetails.filter(
        (job) => job.fspName === fspName,
      );

      if (paymentJobCreationDetailsForFsp.length > 0) {
        await this.transactionJobsCreationService.createAndAddFspSpecificTransactionJobs(
          {
            fspName,
            transactionInputData: paymentJobCreationDetailsForFsp.map(
              (job) => ({
                referenceId: job.referenceId,
                transactionAmount: job.transactionAmount,
                transactionId: job.transactionId!,
              }),
            ),
            userId,
            programId,
            isRetry,
          },
        );
      }
    }
  }

  private async getRetryPaymentJobCreationDetailsOrThrow({
    programId,
    paymentId,
    inputReferenceIds,
  }: {
    programId: number;
    paymentId: number;
    inputReferenceIds?: string[];
  }): Promise<RetryPaymentJobCreationDetails[]> {
    const latestTransactionsFailedForPayment =
      await this.transactionsService.getLastTransactions({
        programId,
        paymentId,
        referenceId: undefined,
        status: TransactionStatusEnum.error,
      });

    const referenceIdsWithLatestTransactionFailedForPayment =
      latestTransactionsFailedForPayment.map((t) => t.referenceId);

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

    // If referenceIds are passed by the user only retry those, otherwise retry all failed transactions for this payment
    const targetedReferenceIdsForPayment =
      inputReferenceIds ?? referenceIdsWithLatestTransactionFailedForPayment;

    const registrations =
      await this.registrationsPaginationService.getRegistrationViewsChunkedByReferenceIds(
        {
          programId,
          referenceIds: targetedReferenceIdsForPayment,
          select: ['referenceId', 'fspName', 'programFspConfigurationName'],
          chunkSize: 4000,
        },
      );

    // Create a map of latest failed transaction by referenceId with the transaction amount
    // Hash-map is faster than find in array when having a lot of registrations to process
    const latestFailedTransactionByReferenceId: Record<
      string,
      { amount: number; transactionId: number }
    > = {};
    for (const transaction of latestTransactionsFailedForPayment) {
      latestFailedTransactionByReferenceId[transaction.referenceId] = {
        amount: transaction.amount,
        transactionId: transaction.transactionId,
      };
    }

    const paymentJobCreationsDetailsList: RetryPaymentJobCreationDetails[] = [];

    for (const registration of registrations) {
      const transactionData =
        latestFailedTransactionByReferenceId[registration.referenceId];

      paymentJobCreationsDetailsList.push({
        transactionAmount: transactionData.amount,
        transactionId: transactionData.transactionId,
        referenceId: registration.referenceId,
        fspName: registration.fspName,
        programFspConfigurationName: registration.programFspConfigurationName,
      });
    }

    return paymentJobCreationsDetailsList;
  }

  private async getPaymentJobCreationDetails({
    referenceIds,
    amount,
    programId,
  }: {
    referenceIds: string[];
    amount: number;
    programId: number;
  }): Promise<PaymentJobCreationDetails[]> {
    const registrations =
      await this.registrationsPaginationService.getRegistrationViewsChunkedByReferenceIds(
        {
          programId,
          referenceIds,
          select: [
            'id',
            'maxPayments',
            'status',
            'referenceId',
            'paymentAmountMultiplier',
            'fspName',
            'programFspConfigurationId',
          ],
          chunkSize: 4000,
        },
      );

    return registrations.map((row) => ({
      registrationId: row.id,
      registrationMaxPayments: row.maxPayments,
      registrationStatus: row.status,
      transactionAmount: amount * row.paymentAmountMultiplier,
      referenceId: row.referenceId,
      fspName: row.fspName,
      programFspConfigurationId: row.programFspConfigurationId,
    }));
  }
}
