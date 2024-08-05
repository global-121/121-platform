import { EventsService } from '@121-service/src/events/events.service';
import {
  FinancialServiceProviderConfigurationEnum,
  FinancialServiceProviderName,
} from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { FinancialServiceProviderRepository } from '@121-service/src/financial-service-providers/repositories/financial-service-provider.repository';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { MessageProcessTypeExtension } from '@121-service/src/notifications/message-job.dto';
import { MessageTemplateService } from '@121-service/src/notifications/message-template/message-template.service';
import { QueueMessageService } from '@121-service/src/notifications/queue-message/queue-message.service';
import { DoTransferOrIssueCardReturnType } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/do-transfer-or-issue-card-return-type.interface';
import { IntersolveVisaApiError } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa-api.error';
import { IntersolveVisaService } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.service';
import { LatestTransactionRepository } from '@121-service/src/payments/transactions/repositories/latest-transaction.repository';
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

interface ProcessTransactionResultInput {
  programId: number;
  paymentNumber: number;
  userId: number;
  calculatedTranserAmountInMajorUnit: number;
  financialServiceProviderId: number;
  registration: RegistrationEntity;
  oldRegistration: RegistrationEntity;
  isRetry: boolean;
  status: StatusEnum;
  errorText?: string;
}

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
    private readonly latestTransactionRepository: LatestTransactionRepository,
    private readonly programRepository: ProgramRepository,
    private readonly eventsService: EventsService,
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

    let transferAmountInMajorUnit: number;
    try {
      transferAmountInMajorUnit =
        await this.intersolveVisaService.calculateTransferAmountWithWalletUpdate(
          registration.id,
          input.transactionAmountInMajorUnit,
        );
    } catch (error) {
      await this.createTransactionAndUpdateRegistration({
        programId: input.programId,
        paymentNumber: input.paymentNumber,
        userId: input.userId,
        calculatedTranserAmountInMajorUnit: input.transactionAmountInMajorUnit, // Use the original amount here since we were unable to calculate the transfer amount. The error message is also clear enough so users should not be confused about the potentially high amount.
        financialServiceProviderId: financialServiceProvider.id,
        registration,
        oldRegistration,
        isRetry: input.isRetry,
        status: StatusEnum.error,
        errorText: `Error calculating transfer amount: ${error?.message}`,
      });
      return;
    }

    // Check if all required properties are present. If not, create a failed transaction and throw an error.
    for (const [name, value] of Object.entries(input)) {
      if (name === 'addressHouseNumberAddition') continue; // Skip non-required property

      // Define "empty" based on your needs. Here, we check for null, undefined, or an empty string.
      if (value === null || value === undefined || value === '') {
        const errorText = `Property ${name} is undefined`;
        await this.createTransactionAndUpdateRegistration({
          programId: input.programId,
          paymentNumber: input.paymentNumber,
          userId: input.userId,
          calculatedTranserAmountInMajorUnit: transferAmountInMajorUnit,
          financialServiceProviderId: financialServiceProvider.id,
          registration,
          oldRegistration,
          isRetry: input.isRetry,
          status: StatusEnum.error,
          errorText,
        });
        return;
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
          transferAmountInMajorUnit: transferAmountInMajorUnit,
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
      if (error instanceof IntersolveVisaApiError) {
        await this.createTransactionAndUpdateRegistration({
          programId: input.programId,
          paymentNumber: input.paymentNumber,
          userId: input.userId,
          calculatedTranserAmountInMajorUnit: transferAmountInMajorUnit,
          financialServiceProviderId: financialServiceProvider.id,
          registration,
          oldRegistration,
          isRetry: input.isRetry,
          status: StatusEnum.error,
          errorText: error?.message,
        });
        return;
      } else {
        throw error;
      }
    }

    if (intersolveVisaDoTransferOrIssueCardReturnDto.cardCreated) {
      await this.createMessageAndAddToQueue({
        type: ProgramNotificationEnum.visaDebitCardCreated,
        programId: input.programId,
        registration: registration,
        amountTransferred:
          intersolveVisaDoTransferOrIssueCardReturnDto.amountTransferredInMajorUnit,
        bulkSize: input.bulkSize,
      });
    } else if (
      intersolveVisaDoTransferOrIssueCardReturnDto.amountTransferredInMajorUnit >
      0
    ) {
      await this.createMessageAndAddToQueue({
        type: ProgramNotificationEnum.visaLoad,
        programId: input.programId,
        registration: registration,
        amountTransferred:
          intersolveVisaDoTransferOrIssueCardReturnDto.amountTransferredInMajorUnit,
        bulkSize: input.bulkSize,
      });
    }

    await this.createTransactionAndUpdateRegistration({
      programId: input.programId,
      paymentNumber: input.paymentNumber,
      userId: input.userId,
      calculatedTranserAmountInMajorUnit:
        intersolveVisaDoTransferOrIssueCardReturnDto.amountTransferredInMajorUnit,
      financialServiceProviderId: financialServiceProvider.id,
      registration,
      oldRegistration,
      isRetry: input.isRetry,
      status: StatusEnum.success,
    });
  }

  private async createTransactionAndUpdateRegistration({
    programId,
    paymentNumber,
    userId,
    calculatedTranserAmountInMajorUnit,
    financialServiceProviderId,
    registration,
    oldRegistration,
    isRetry,
    status,
    errorText: errorMessage,
  }: ProcessTransactionResultInput): Promise<void> {
    const resultTransaction = await this.createTransaction({
      amount: calculatedTranserAmountInMajorUnit,
      registration: registration,
      financialServiceProviderId: financialServiceProviderId,
      programId: programId,
      paymentNumber: paymentNumber,
      userId: userId,
      status: status,
      errorMessage: errorMessage,
    });

    await this.latestTransactionRepository.insertOrUpdateFromTransaction(
      resultTransaction,
    );

    if (!isRetry) {
      await this.updatePaymentCountAndStatusInRegistration(
        registration,
        programId,
      );
      // Added this check to avoid a bit of processing time if the status is the same
      if (
        oldRegistration.registrationStatus !== registration.registrationStatus
      ) {
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

  private async createTransaction({
    amount, // transaction entity are always in major unit
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
  }) {
    const transaction = new TransactionEntity();
    transaction.amount = amount;
    transaction.created = new Date();
    transaction.registration = registration;
    transaction.financialServiceProviderId = financialServiceProviderId;
    transaction.programId = programId;
    transaction.payment = paymentNumber;
    transaction.userId = userId;
    transaction.status = status;
    transaction.transactionStep = 1;
    transaction.errorMessage = errorMessage ?? null;

    return await this.transactionScopedRepository.save(transaction);
  }

  private async updatePaymentCountAndStatusInRegistration(
    registration: RegistrationEntity,
    programId: number,
  ): Promise<void> {
    const program = await this.programRepository.findByIdOrFail(programId);

    const paymentCount = (registration.paymentCount || 0) + 1;

    let updateData: {
      paymentCount: number;
      registrationStatus?: RegistrationStatusEnum;
    };
    if (
      program.enableMaxPayments &&
      registration.maxPayments &&
      paymentCount >= registration.maxPayments
    ) {
      updateData = {
        paymentCount: (registration.paymentCount || 0) + 1,
        registrationStatus: RegistrationStatusEnum.completed,
      };
    } else {
      updateData = {
        paymentCount: paymentCount,
      };
    }

    await this.registrationScopedRepository.updateUnscoped(
      registration.id,
      updateData,
    );
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
  }) {
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
}
