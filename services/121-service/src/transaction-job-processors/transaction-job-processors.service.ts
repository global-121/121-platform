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
import { IntersolveVisaService } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.service';
import { ProgramFinancialServiceProviderConfigurationRepository } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.repository';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';
import {
  StoreTransactionJob,
  StoreTransactionJobProcessorsService,
} from '@121-service/src/store-transaction-job-processors/store-transaction-job-processors.service';
import { IntersolveVisaTransactionJobDto } from '@121-service/src/transaction-queues/dto/intersolve-visa-transaction-job.dto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TransactionJobProcessorsService {
  public constructor(
    private readonly intersolveVisaService: IntersolveVisaService,
    private readonly messageTemplateService: MessageTemplateService,
    private readonly programFinancialServiceProviderConfigurationRepository: ProgramFinancialServiceProviderConfigurationRepository,
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly queueMessageService: QueueMessageService,
    private readonly financialServiceProviderRepository: FinancialServiceProviderRepository,
    private readonly eventsService: EventsService,
    private readonly storeTransactionJobProcessorsService: StoreTransactionJobProcessorsService,
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
        await this.addStoreTransactonJobToQueue({
          isTransactionSuccess: false,
          amount: input.transactionAmount,
          registration: registration,
          financialServiceProviderId: financialServiceProvider.id,
          programId: input.programId,
          paymentNumber: input.paymentNumber,
          userId: input.userId,
          status: StatusEnum.error,
          errorMessage: errorText,
          storeOnlyTransaction: true,
        });

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
      await this.addStoreTransactonJobToQueue({
        isTransactionSuccess: false,
        amount: input.transactionAmount,
        registration: registration,
        financialServiceProviderId: financialServiceProvider.id,
        programId: input.programId,
        paymentNumber: input.paymentNumber,
        userId: input.userId,
        status: StatusEnum.error,
        errorMessage: `An error occured: ${error}`,
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

    await this.addStoreTransactonJobToQueue({
      isTransactionSuccess: true,
      amount: intersolveVisaDoTransferOrIssueCardReturnDto.amountTransferred,
      registration: registration,
      financialServiceProviderId: financialServiceProvider.id,
      programId: input.programId,
      paymentNumber: input.paymentNumber,
      userId: input.userId,
      status: StatusEnum.success,
      isRetry: input.isRetry,
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

  private async addStoreTransactonJobToQueue(
    storeTransactionData: StoreTransactionJob,
  ): Promise<void> {
    await this.storeTransactionJobProcessorsService.addStoreTransactionJobToQueue(
      storeTransactionData,
    );
  }
}
