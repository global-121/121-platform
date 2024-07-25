import { UnitOfWork } from '@121-service/src/database/unit-of-work.service';
import { EventsService } from '@121-service/src/events/events.service';
import {
  FinancialServiceProviderConfigurationEnum,
  FinancialServiceProviderName,
} from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { FinancialServiceProviderEntity } from '@121-service/src/financial-service-providers/financial-service-provider.entity';
import { FinancialServiceProviderRepository } from '@121-service/src/financial-service-providers/repositories/financial-service-provider.repository';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { MessageProcessTypeExtension } from '@121-service/src/notifications/message-job.dto';
import { MessageTemplateService } from '@121-service/src/notifications/message-template/message-template.service';
import { QueueMessageService } from '@121-service/src/notifications/queue-message/queue-message.service';
import { DoTransferOrIssueCardReturnType } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/do-transfer-or-issue-card-return-type.interface';
import { IntersolveVisaService } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.service';
import { LatestTransactionEntity } from '@121-service/src/payments/transactions/latest-transaction.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { ProgramFinancialServiceProviderConfigurationRepository } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.repository';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';
import { IntersolveVisaTransactionJobDto } from '@121-service/src/transaction-queues/dto/intersolve-visa-transaction-job.dto';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class TransactionJobProcessorsService {
  public constructor(
    private readonly intersolveVisaService: IntersolveVisaService,
    private readonly messageTemplateService: MessageTemplateService,
    private readonly programFinancialServiceProviderConfigurationRepository: ProgramFinancialServiceProviderConfigurationRepository,
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly queueMessageService: QueueMessageService,
    @Inject(getScopedRepositoryProviderName(TransactionEntity))
    private readonly transactionScopedRepository: ScopedRepository<TransactionEntity>,
    private readonly financialServiceProviderRepository: FinancialServiceProviderRepository,
    private readonly programRepository: ProgramRepository,
    private readonly eventsService: EventsService,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  public async processIntersolveVisaTransactionJob(
    input: IntersolveVisaTransactionJobDto,
  ): Promise<void> {
    const registration =
      await this.registrationScopedRepository.getByReferenceId({
        referenceId: input.referenceId,
      });
    if (!registration) {
      throw new Error(
        `Registration was not found for referenceId ${input.referenceId}`,
      );
    }
    const oldRegistration = structuredClone(registration);
    const financialServiceProvider =
      await this.financialServiceProviderRepository.getByName(
        FinancialServiceProviderName.intersolveVisa,
      );
    if (!financialServiceProvider) {
      throw new Error('Financial Service Provider not found');
    }

    // Check if all required properties are present. If not, create a failed transaction and throw an error.
    for (const key in input) {
      if (key === 'addressHouseNumberAddition') continue; // Skip non-required property

      // Define "empty" based on your needs. Here, we check for null, undefined, or an empty string.
      if (
        input[key] === null ||
        input[key] === undefined ||
        input[key] === ''
      ) {
        const errorText = `Property ${key} is undefined`;
        const transaction = await this.getTransactionEntity({
          amount: input.transactionAmount,
          registration: registration,
          financialServiceProviderId: financialServiceProvider.id,
          programId: input.programId,
          paymentNumber: input.paymentNumber,
          userId: input.userId,
          status: StatusEnum.error,
          errorMessage: errorText,
        });
        await this.saveTransaction(transaction);

        throw new Error(errorText);
      }
    }

    let intersolveVisaDoTransferOrIssueCardReturnDto: DoTransferOrIssueCardReturnType;
    try {
      const intersolveVisaConfig =
        await this.programFinancialServiceProviderConfigurationRepository.getValuesByNamesOrThrow(
          {
            programId: input.programId,
            financialServiceProviderName:
              FinancialServiceProviderName.intersolveVisa,
            names: [
              FinancialServiceProviderConfigurationEnum.brandCode,
              FinancialServiceProviderConfigurationEnum.coverLetterCode,
              FinancialServiceProviderConfigurationEnum.fundingTokenCode,
            ],
          },
        );
      intersolveVisaDoTransferOrIssueCardReturnDto =
        await this.intersolveVisaService.doTransferOrIssueCard({
          registrationId: registration.id,
          createCustomerReference: input.referenceId,
          transferReference: `ReferenceId=${input.referenceId},PaymentNumber=${input.paymentNumber}`,
          name: input.name!,
          contactInformation: {
            addressStreet: input.addressStreet!,
            addressHouseNumber: input.addressHouseNumber!,
            addressHouseNumberAddition: input.addressHouseNumberAddition,
            addressPostalCode: input.addressPostalCode!,
            addressCity: input.addressCity!,
            phoneNumber: input.phoneNumber!,
          },
          transferAmount: input.transactionAmount,
          brandCode: intersolveVisaConfig.find(
            (c) =>
              c.name === FinancialServiceProviderConfigurationEnum.brandCode,
          )?.value as string, // This must be a string. If it is not, the intersolve API will return an error (maybe).
          coverLetterCode: intersolveVisaConfig.find(
            (c) =>
              c.name ===
              FinancialServiceProviderConfigurationEnum.coverLetterCode,
          )?.value as string, // This must be a string. If it is not, the intersolve API will return an error (maybe).
          fundingTokenCode: intersolveVisaConfig.find(
            (c) =>
              c.name ===
              FinancialServiceProviderConfigurationEnum.fundingTokenCode,
          )?.value as string, // This must be a string. If it is not, the intersolve API will return an error (maybe).
        });
    } catch (error) {
      await this.handleTransactionFailure({
        input,
        registration,
        financialServiceProvider,
        error,
      });

      throw new Error(error);
    }

    const messageType = intersolveVisaDoTransferOrIssueCardReturnDto.cardCreated
      ? ProgramNotificationEnum.visaDebitCardCreated
      : intersolveVisaDoTransferOrIssueCardReturnDto.amountTransferred > 0
        ? ProgramNotificationEnum.visaLoad
        : null;

    if (messageType) {
      await this.createMessageAndAddToQueue({
        type: messageType,
        programId: input.programId,
        registration: registration,
        amountTransferred:
          intersolveVisaDoTransferOrIssueCardReturnDto.amountTransferred,
        bulkSize: input.bulkSize,
      });
    }

    await this.handleTransactionSuccess({
      input,
      registration,
      financialServiceProvider,
      intersolveVisaDoTransferOrIssueCardReturnDto,
    });

    if (!input.isRetry) {
      await this.eventsService.log(
        {
          id: oldRegistration.id,
          status: oldRegistration.registrationStatus ?? undefined,
        },
        {
          id: registration.id,
          status: registration.registrationStatus ?? undefined,
        },
        {
          registrationAttributes: ['status'],
        },
      );
    }
  }

  private async handleTransactionSuccess({
    input,
    registration,
    financialServiceProvider,
    intersolveVisaDoTransferOrIssueCardReturnDto,
  }: {
    input: IntersolveVisaTransactionJobDto;
    registration: RegistrationEntity;
    financialServiceProvider: FinancialServiceProviderEntity;
    intersolveVisaDoTransferOrIssueCardReturnDto: DoTransferOrIssueCardReturnType;
  }): Promise<void> {
    // Start a new unit of work to handle the transaction
    await this.unitOfWork.execute(async () => {
      // Get the database transaction manager from the unit of work
      const manager = this.unitOfWork.getManager();

      // Create a TransactionEntity with the provided details
      const transaction = await this.getTransactionEntity({
        amount: intersolveVisaDoTransferOrIssueCardReturnDto.amountTransferred,
        registration: registration,
        financialServiceProviderId: financialServiceProvider.id,
        programId: input.programId,
        paymentNumber: input.paymentNumber,
        userId: input.userId,
        status: StatusEnum.success,
      });

      // Save the transaction entity first to get its id
      const savedTransaction = await manager.save(
        TransactionEntity,
        transaction,
      );

      // Create LatestTransactionEntity to store the latest transaction details
      const latestTransaction = new LatestTransactionEntity();
      latestTransaction.registrationId = savedTransaction.registrationId;
      latestTransaction.payment = savedTransaction.payment;
      latestTransaction.transactionId = savedTransaction.id;

      // Save the latest transaction entity
      await manager.save(LatestTransactionEntity, latestTransaction);

      // If the transaction is not a retry, update the payment count and status in the registration entity
      if (!input.isRetry) {
        const updatedRegistration =
          await this.getRegistrationEntityWithUpdatedPaymentCountAndStatus(
            registration,
            input.programId,
          );

        // Save the updated registration entity
        await manager.save(RegistrationEntity, updatedRegistration);
      }
    });
  }

  private async handleTransactionFailure({
    input,
    registration,
    financialServiceProvider,
    error,
  }: {
    input: IntersolveVisaTransactionJobDto;
    registration: RegistrationEntity;
    financialServiceProvider: FinancialServiceProviderEntity;
    error: Error;
  }): Promise<void> {
    // Start a new unit of work to handle the transaction failure
    await this.unitOfWork.execute(async () => {
      // Get the database transaction manager from the unit of work
      const manager = this.unitOfWork.getManager();

      // Create TransactionEntity with the provided details, marking the status as error
      const transaction = await this.getTransactionEntity({
        amount: input.transactionAmount,
        registration: registration,
        financialServiceProviderId: financialServiceProvider.id,
        programId: input.programId,
        paymentNumber: input.paymentNumber,
        userId: input.userId,
        status: StatusEnum.error,
        errorMessage: `An error occured: ${error}`,
      });

      // Save the transaction entity first to get its id
      const savedTransaction = await manager.save(
        TransactionEntity,
        transaction,
      );

      // Create LatestTransactionEntity to store the latest transaction details
      const latestTransaction = new LatestTransactionEntity();
      latestTransaction.registrationId = savedTransaction.registrationId;
      latestTransaction.payment = savedTransaction.payment;
      latestTransaction.transactionId = savedTransaction.id;

      // Save the latest transaction entity
      await manager.save(LatestTransactionEntity, latestTransaction);

      // Update the registration entity's payment count and status
      const updatedRegistration =
        await this.getRegistrationEntityWithUpdatedPaymentCountAndStatus(
          registration,
          input.programId,
        );

      // Update the registration entity
      await manager.save(RegistrationEntity, updatedRegistration);
    });
  }

  private async getTransactionEntity({
    amount,
    registration,
    financialServiceProviderId,
    programId,
    paymentNumber,
    userId,
    status,
    errorMessage,
  }: {
    amount: number;
    registration: RegistrationEntity;
    financialServiceProviderId: number;
    programId: number;
    paymentNumber: number;
    userId: number;
    status: StatusEnum;
    errorMessage?: string;
  }): Promise<TransactionEntity> {
    const transaction = new TransactionEntity();
    transaction.amount = amount;
    transaction.registration = registration;
    transaction.financialServiceProviderId = financialServiceProviderId;
    transaction.programId = programId;
    transaction.payment = paymentNumber;
    transaction.userId = userId;
    transaction.status = status;
    transaction.transactionStep = 1;
    transaction.errorMessage = errorMessage ?? null;
    transaction.created = new Date();

    return transaction;
  }

  private async saveTransaction(transaction: TransactionEntity): Promise<void> {
    await this.transactionScopedRepository.save(transaction);
  }

  private async getRegistrationEntityWithUpdatedPaymentCountAndStatus(
    registration: RegistrationEntity,
    programId: number,
  ): Promise<RegistrationEntity> {
    const program = await this.programRepository.findByIdOrFail(programId);
    // TODO: Implement retry attempts for the paymentCount and status update.
    // See old code for counting the transactions
    // See if failed transactions also lead to status 'Completed' and is retryable
    registration.paymentCount = (registration.paymentCount || 0) + 1;

    if (
      program.enableMaxPayments &&
      registration.maxPayments &&
      registration.paymentCount >= registration.maxPayments
    ) {
      registration.registrationStatus = RegistrationStatusEnum.completed;
    }

    return registration;
  }

  private async createMessageAndAddToQueue({
    type,
    programId,
    registration,
    amountTransferred,
    bulkSize,
  }: {
    type: ProgramNotificationEnum;
    programId: number;
    registration: RegistrationEntity;
    amountTransferred: number;
    bulkSize: number;
  }): Promise<void> {
    const templates =
      await this.messageTemplateService.getMessageTemplatesByProgramId(
        programId,
        type,
      );
    let messageContent = templates.find(
      (template) => template.language === registration.preferredLanguage,
    )?.message;
    if (!messageContent) {
      messageContent = templates.find(
        (template) => template.language === LanguageEnum.en,
      )?.message;
    }
    // Note: messageContent is possible undefined/null here, so we're assuming here that the message processor will handle this properly.

    if (messageContent) {
      const dynamicContents = [String(amountTransferred)];
      for (const [i, dynamicContent] of dynamicContents.entries()) {
        const replaceString = `[[${i + 1}]]`;
        if (messageContent!.includes(replaceString)) {
          messageContent = messageContent!.replace(
            replaceString,
            dynamicContent,
          );
        }
      }
    }

    await this.addMessageJobToQueue({
      registration: registration,
      message: messageContent,
      bulksize: bulkSize,
    });
  }

  private async addMessageJobToQueue({
    registration,
    message,
    bulksize,
  }: {
    registration: RegistrationEntity | Omit<RegistrationViewEntity, 'data'>;
    message?: string;
    messageTemplateKey?: string;
    bulksize?: number;
  }): Promise<void> {
    await this.queueMessageService.addMessageToQueue({
      registration: registration,
      message: message,
      messageContentType: MessageContentType.payment,
      messageProcessType:
        MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric,
      bulksize: bulksize,
    });
  }
}
