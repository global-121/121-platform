import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginateQuery } from 'nestjs-paginate';
import { Equal, Repository } from 'typeorm';

import { AdditionalActionType } from '@121-service/src/actions/action.entity';
import { ActionsService } from '@121-service/src/actions/actions.service';
import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { getFspConfigurationRequiredProperties } from '@121-service/src/fsps/fsp-settings.helpers';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { MessageContentDetails } from '@121-service/src/notifications/interfaces/message-content-details.interface';
import { MessageTemplateService } from '@121-service/src/notifications/message-template/message-template.service';
import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';
import { TransactionCreationDetails } from '@121-service/src/payments/interfaces/transaction-creation-details.interface';
import { PaymentEventsService } from '@121-service/src/payments/payment-events/payment-events.service';
import { PaymentsExecutionHelperService } from '@121-service/src/payments/services/payments-execution-helper.service';
import { PaymentsProgressHelperService } from '@121-service/src/payments/services/payments-progress.helper.service';
import { TransactionJobsCreationService } from '@121-service/src/payments/services/transaction-jobs-creation.service';
import { TransactionViewScopedRepository } from '@121-service/src/payments/transactions/repositories/transaction.view.scoped.repository';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import {
  BulkActionResultPaymentDto,
  BulkActionResultRetryPaymentDto,
} from '@121-service/src/registration/dto/bulk-action-result.dto';
import { RegistrationViewEntity } from '@121-service/src/registration/entities/registration-view.entity';
import { GenericRegistrationAttributes } from '@121-service/src/registration/enum/registration-attribute.enum';
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
    private readonly transactionViewScopedRepository: TransactionViewScopedRepository,
    private readonly registrationsBulkService: RegistrationsBulkService,
    private readonly registrationsPaginationService: RegistrationsPaginationService,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly paymentEventsService: PaymentEventsService,
    private readonly transactionJobsCreationService: TransactionJobsCreationService,
    private readonly paymentsProgressHelperService: PaymentsProgressHelperService,
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly programRepository: ProgramRepository,
    private readonly messageTemplateService: MessageTemplateService,
    private readonly paymentsExecutionHelperService: PaymentsExecutionHelperService,
  ) {}

  public async createPayment({
    userId,
    programId,
    transferValue,
    query,
    dryRun,
    note,
  }: {
    userId: number;
    programId: number;
    transferValue: number | undefined;
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
    console.log('paginateQuery: ', paginateQuery);

    // Fill bulkActionResultDto with meta data of the payment being done
    const bulkActionResultDto = {
      totalFilterCount: 0,
      applicableCount: 0,
      nonApplicableCount: 0,
    };
    await this.registrationsBulkService.getBulkActionResult(
      paginateQuery,
      programId,
      this.getPaymentBaseQuery(), // We need to create a separate queryBuilder object twice or it will be modified twice
    );
    // console.log('bulkActionResultDto: ', bulkActionResultDto);

    // If amount is not defined do not calculate the totalMultiplierSum
    // This happens when you call the endpoint with dryRun=true
    // Calling with dryrun is true happens in the pa table when you try to do a payment to decide which registrations are selectable
    if (!transferValue) {
      return {
        ...bulkActionResultDto,
        sumPaymentAmountMultiplier: 0,
        programFspConfigurationNames: [],
      };
    }

    // Get array of RegistrationViewEntity objects to be paid
    const registrationsForPayment =
      await this.getRegistrationsForPaymentChunked(programId, paginateQuery);
    console.log('registrationsForPayment: ', registrationsForPayment.length);

    // Calculate the totalMultiplierSum and create an array with all FSPs for this payment
    // Get the sum of the paymentAmountMultiplier of all registrations to calculate the total amount of money to be paid in frontend
    let totalMultiplierSum = 0;
    // This loop is pretty fast: with 131k registrations it takes ~38ms

    for (const registration of registrationsForPayment) {
      totalMultiplierSum =
        totalMultiplierSum + registration.paymentAmountMultiplier;
      // This is only needed in actual doPayment call
    }
    console.log('totalMultiplierSum: ', totalMultiplierSum);

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
      console.log('paymentId: ', paymentId);
      bulkActionResultPaymentDto.id = paymentId;
      // TODO: REFACTOR: userId not be passed down, but should be available in a context object; registrationsForPayment.length is redundant, as it is the same as referenceIds.length
      void this.initiatePayment({
        userId,
        programId,
        paymentId,
        transferValue,
        referenceIds,
      })
        .catch((e) => {
          this.azureLogService.logError(e, true);
        })
        .finally(() => {
          // TODO: Remove this, along with all payment action saving?
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

  // createTransactionsAndUpdateRegistrations moved to PaymentsExecutionHelperService

  public async setStatusToCompletedIfApplicable(
    programId: number,
    userId: number,
  ): Promise<void> {
    const program = await this.programRepository.findByIdOrFail(programId);
    if (!program.enableMaxPayments) {
      return;
    }

    const registrationsToComplete =
      await this.registrationScopedRepository.getRegistrationsToComplete(
        programId,
      );
    if (registrationsToComplete.length === 0) {
      return;
    }

    const isTemplateAvailable =
      await this.messageTemplateService.isTemplateAvailable(
        programId,
        RegistrationStatusEnum.completed,
      );
    const messageContentDetails: MessageContentDetails = isTemplateAvailable
      ? {
          messageTemplateKey: RegistrationStatusEnum.completed,
          messageContentType: MessageContentType.completed,
          message: '',
        }
      : {};

    await this.registrationsBulkService.applyRegistrationStatusChangeAndSendMessageByReferenceIds(
      {
        referenceIds: registrationsToComplete.map((r) => r.referenceId),
        programId,
        registrationStatus: RegistrationStatusEnum.completed,
        userId,
        messageContentDetails,
      },
    );
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

  private async initiatePayment({
    userId,
    programId,
    paymentId,
    transferValue,
    referenceIds,
  }: {
    userId: number;
    programId: number;
    paymentId: number;
    transferValue: number;
    referenceIds: string[];
  }): Promise<void> {
    await this.actionService.saveAction(
      userId,
      programId,
      AdditionalActionType.paymentStarted,
    );

    const transactionCreationDetails = await this.getTransactionCreationDetails(
      {
        referenceIds,
        transferValue,
        programId,
      },
    );
    console.log(
      'transactionCreationDetails: ',
      transactionCreationDetails.length,
    );

    const transactionIds =
      await this.paymentsExecutionHelperService.createTransactionsAndUpdateRegistrationPaymentCount(
        {
          transactionCreationDetails,
          paymentId,
          userId,
        },
      );
    console.log('transactionIds: ', transactionIds.length);

    await this.paymentsExecutionHelperService.setStatusToCompletedIfApplicable(
      programId,
      userId,
    );

    await this.createTransactionJobs({
      programId,
      transactionIds,
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

  public async createTransactionJobs({
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

  private async getTransactionCreationDetails({
    referenceIds,
    transferValue,
    programId,
  }: {
    referenceIds: string[];
    transferValue: number;
    programId: number;
  }): Promise<TransactionCreationDetails[]> {
    const idColumn: keyof RegistrationViewEntity = 'id';
    const programFspConfigurationIdColumn: keyof RegistrationViewEntity =
      'programFspConfigurationId';
    const registrations =
      await this.registrationsPaginationService.getRegistrationViewsChunkedByReferenceIds(
        {
          programId,
          referenceIds,
          select: [
            idColumn,
            GenericRegistrationAttributes.paymentAmountMultiplier,
            programFspConfigurationIdColumn,
          ],
          chunkSize: 4000,
        },
      );

    return registrations.map((row) => ({
      registrationId: row.id,
      transferValue: transferValue * row.paymentAmountMultiplier,
      programFspConfigurationId: row.programFspConfigurationId,
    }));
  }
}
