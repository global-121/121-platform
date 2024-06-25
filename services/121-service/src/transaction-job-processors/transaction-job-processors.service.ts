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
import { IntersolveVisaDoTransferOrIssueCardReturnDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-visa-do-transfer-or-issue-card-return.dto';
import { IntersolveVisaService } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.service';
import { LatestTransactionRepository } from '@121-service/src/payments/transactions/repositories/latest-transaction.repository';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configuration.entity';
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
    private readonly latestTransactionRepository: LatestTransactionRepository,
    private readonly programRepository: ProgramRepository,
    private readonly eventsService: EventsService,
  ) {}

  public async processIntersolveVisaTransactionJob(
    input: IntersolveVisaTransactionJobDto,
  ): Promise<void> {
    const registration =
      await this.registrationScopedRepository.getRegistrationByReferenceId(
        input.referenceId,
      );
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
    await Promise.all(
      Object.keys(input).map(async (key) => {
        if (key !== 'addressHouseNumberAddition' && input[key] === undefined) {
          // TODO: Group all missing keys and throw them at once instead of throwing only one
          const errorText = `Property ${key} is undefined`;
          await this.createTransaction({
            amount: input.transactionAmount,
            registration: registration,
            financialServiceProviderId: financialServiceProvider.id,
            programId: input.programId,
            paymentNumber: input.paymentNumber,
            userId: input.userId,
            status: StatusEnum.error,
            errorMessage: errorText,
          });
          throw new Error(errorText);
        }
      }),
    );

    const intersolveVisaConfig =
      await this.programFinancialServiceProviderConfigurationRepository.findByProgramIdAndFinancialServiceProviderName(
        input.programId,
        FinancialServiceProviderName.intersolveVisa,
      );

    const coverLetterCode =
      this.getProgramFinancialServiceProviderConfigurationValueByName({
        intersolveVisaConfig,
        name: FinancialServiceProviderConfigurationEnum.coverLetterCode,
        programId: input.programId,
      });
    const brandCode =
      this.getProgramFinancialServiceProviderConfigurationValueByName({
        intersolveVisaConfig,
        name: FinancialServiceProviderConfigurationEnum.brandCode,
        programId: input.programId,
      });
    const fundingTokenCode =
      this.getProgramFinancialServiceProviderConfigurationValueByName({
        intersolveVisaConfig,
        name: FinancialServiceProviderConfigurationEnum.fundingTokenCode,
        programId: input.programId,
      });

    let intersolveVisaDoTransferOrIssueCardReturnDto: IntersolveVisaDoTransferOrIssueCardReturnDto;
    try {
      intersolveVisaDoTransferOrIssueCardReturnDto =
        await this.intersolveVisaService.doTransferOrIssueCard({
          registrationId: registration.id,
          reference: input.referenceId,
          name: input.name!,
          addressStreet: input.addressStreet!,
          addressHouseNumber: input.addressHouseNumber!,
          addressHouseNumberAddition: input.addressHouseNumberAddition,
          addressPostalCode: input.addressPostalCode!,
          addressCity: input.addressCity!,
          phoneNumber: input.phoneNumber!,
          transferAmount: input.transactionAmount,
          brandCode: brandCode,
          coverLetterCode: coverLetterCode,
          fundingTokenCode: fundingTokenCode,
        });
    } catch (error) {
      await this.createTransaction({
        amount: input.transactionAmount,
        registration: registration,
        financialServiceProviderId: financialServiceProvider.id,
        programId: input.programId,
        paymentNumber: input.paymentNumber,
        userId: input.userId,
        status: StatusEnum.error,
        errorMessage: `An error occured: ${error}`,
      });
      await this.updatePaymentCountAndStatusInRegistration(
        registration,
        input.programId,
      );
      throw new Error(error);
    }

    if (intersolveVisaDoTransferOrIssueCardReturnDto.cardCreated) {
      await this.createMessageAndAddToQueue({
        type: ProgramNotificationEnum.visaDebitCardCreated,
        programId: input.programId,
        registration: registration,
        amountTransferred:
          intersolveVisaDoTransferOrIssueCardReturnDto.amountTransferred,
        bulkSize: input.bulkSize,
      });
    } else if (
      intersolveVisaDoTransferOrIssueCardReturnDto.amountTransferred > 0
    ) {
      await this.createMessageAndAddToQueue({
        type: ProgramNotificationEnum.visaLoad,
        programId: input.programId,
        registration: registration,
        amountTransferred:
          intersolveVisaDoTransferOrIssueCardReturnDto.amountTransferred,
        bulkSize: input.bulkSize,
      });
    }

    const resultTransaction = await this.createTransaction({
      amount: intersolveVisaDoTransferOrIssueCardReturnDto.amountTransferred,
      registration: registration,
      financialServiceProviderId: financialServiceProvider.id,
      programId: input.programId,
      paymentNumber: input.paymentNumber,
      userId: input.userId,
      status: StatusEnum.success,
    });
    await this.latestTransactionRepository.insertOrUpdateFromTransaction(
      resultTransaction,
    );

    if (!input.isRetry) {
      await this.updatePaymentCountAndStatusInRegistration(
        registration,
        input.programId,
      );
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
    const program = await this.programRepository.getById(programId);
    // TODO: Implement retry attempts for the paymentCount and status update.
    // See old code for counting the transactions
    // See if failed transactions also lead to status 'Completed' and is retryable
    registration.paymentCount = registration.paymentCount
      ? registration.paymentCount + 1
      : 1;

    if (
      program.enableMaxPayments &&
      registration.maxPayments &&
      registration.paymentCount >= registration.maxPayments
    ) {
      registration.registrationStatus = RegistrationStatusEnum.completed;
    }

    await this.registrationScopedRepository.save(registration);
  }

  private getProgramFinancialServiceProviderConfigurationValueByName({
    intersolveVisaConfig,
    name,
    programId,
  }: {
    intersolveVisaConfig: ProgramFinancialServiceProviderConfigurationEntity[];
    name: FinancialServiceProviderConfigurationEnum;
    programId: number;
  }) {
    const value = intersolveVisaConfig.find(
      (config) => config.name === name,
    )?.value;
    if (!value && typeof value !== 'string') {
      throw new Error(
        `No ${name} found or incorrect format for program ${programId}. Please update the program financial service provider configuration.`,
      );
    }
    return value as string;
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
