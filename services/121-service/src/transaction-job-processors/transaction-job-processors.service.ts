import { Inject, Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { EventsService } from '@121-service/src/events/events.service';
import { FinancialServiceProviderConfigurationProperties } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { MessageProcessTypeExtension } from '@121-service/src/notifications/message-job.dto';
import { MessageQueuesService } from '@121-service/src/notifications/message-queues/message-queues.service';
import { MessageTemplateService } from '@121-service/src/notifications/message-template/message-template.service';
import { DoTransferOrIssueCardReturnType } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/do-transfer-or-issue-card-return-type.interface';
import { IntersolveVisaService } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.service';
import { IntersolveVisaApiError } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa-api.error';
import { SafaricomTransferEntity } from '@121-service/src/payments/fsp-integration/safaricom/entities/safaricom-transfer.entity';
import { DuplicateOriginatorConversationIdError } from '@121-service/src/payments/fsp-integration/safaricom/errors/duplicate-originator-conversation-id.error';
import { SafaricomApiError } from '@121-service/src/payments/fsp-integration/safaricom/errors/safaricom-api.error';
import { SafaricomTransferScopedRepository } from '@121-service/src/payments/fsp-integration/safaricom/repositories/safaricom-transfer.scoped.repository';
import { SafaricomService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { LatestTransactionRepository } from '@121-service/src/payments/transactions/repositories/latest-transaction.repository';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { ProgramFinancialServiceProviderConfigurationRepository } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.repository';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { IntersolveVisaTransactionJobDto } from '@121-service/src/transaction-queues/dto/intersolve-visa-transaction-job.dto';
import { SafaricomTransactionJobDto } from '@121-service/src/transaction-queues/dto/safaricom-transaction-job.dto';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

interface ProcessTransactionResultInput {
  programId: number;
  paymentNumber: number;
  userId: number;
  calculatedTransferAmountInMajorUnit: number;
  programFinancialServiceProviderConfigurationId: number;
  registration: RegistrationEntity;
  oldRegistration: RegistrationEntity;
  isRetry: boolean;
  status: TransactionStatusEnum;
  errorText?: string;
}

@Injectable()
export class TransactionJobProcessorsService {
  public constructor(
    private readonly intersolveVisaService: IntersolveVisaService,
    private readonly safaricomService: SafaricomService,
    private readonly messageTemplateService: MessageTemplateService,
    private readonly programFinancialServiceProviderConfigurationRepository: ProgramFinancialServiceProviderConfigurationRepository,
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly safaricomTransferScopedRepository: SafaricomTransferScopedRepository,
    private readonly queueMessageService: MessageQueuesService,
    @Inject(getScopedRepositoryProviderName(TransactionEntity))
    private readonly transactionScopedRepository: ScopedRepository<TransactionEntity>,
    private readonly latestTransactionRepository: LatestTransactionRepository,
    private readonly programRepository: ProgramRepository,
    private readonly eventsService: EventsService,
  ) {}

  public async processIntersolveVisaTransactionJob(
    input: IntersolveVisaTransactionJobDto,
  ): Promise<void> {
    const registration = await this.getRegistrationOrThrow(input.referenceId);
    const oldRegistration = structuredClone(registration);

    let transferAmountInMajorUnit: number;
    try {
      transferAmountInMajorUnit =
        await this.intersolveVisaService.calculateTransferAmountWithWalletRetrieval(
          {
            registrationId: registration.id,
            inputTransferAmountInMajorUnit: input.transactionAmountInMajorUnit,
          },
        );
    } catch (error) {
      if (error instanceof IntersolveVisaApiError) {
        await this.createTransactionAndUpdateRegistration({
          programId: input.programId,
          paymentNumber: input.paymentNumber,
          userId: input.userId,
          calculatedTransferAmountInMajorUnit:
            input.transactionAmountInMajorUnit, // Use the original amount here since we were unable to calculate the transfer amount. The error message is also clear enough so users should not be confused about the potentially high amount.
          programFinancialServiceProviderConfigurationId:
            input.programFinancialServiceProviderConfigurationId,
          registration,
          oldRegistration,
          isRetry: input.isRetry,
          status: TransactionStatusEnum.error,
          errorText: `Error calculating transfer amount: ${error?.message}`,
        });
        return;
      }

      throw error;
    }

    let intersolveVisaDoTransferOrIssueCardReturnDto: DoTransferOrIssueCardReturnType;
    try {
      const intersolveVisaConfig =
        await this.programFinancialServiceProviderConfigurationRepository.getPropertiesByNamesOrThrow(
          {
            programFinancialServiceProviderConfigurationId:
              input.programFinancialServiceProviderConfigurationId,
            names: [
              FinancialServiceProviderConfigurationProperties.brandCode,
              FinancialServiceProviderConfigurationProperties.coverLetterCode,
              FinancialServiceProviderConfigurationProperties.fundingTokenCode,
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
          transferAmountInMajorUnit,
          brandCode: intersolveVisaConfig.find(
            (c) =>
              c.name ===
              FinancialServiceProviderConfigurationProperties.brandCode,
          )?.value as string, // This must be a string. If it is not, the intersolve API will return an error (maybe).
          coverLetterCode: intersolveVisaConfig.find(
            (c) =>
              c.name ===
              FinancialServiceProviderConfigurationProperties.coverLetterCode,
          )?.value as string, // This must be a string. If it is not, the intersolve API will return an error (maybe).
          fundingTokenCode: intersolveVisaConfig.find(
            (c) =>
              c.name ===
              FinancialServiceProviderConfigurationProperties.fundingTokenCode,
          )?.value as string, // This must be a string. If it is not, the intersolve API will return an error (maybe).
        });
    } catch (error) {
      if (error instanceof IntersolveVisaApiError) {
        await this.createTransactionAndUpdateRegistration({
          programId: input.programId,
          paymentNumber: input.paymentNumber,
          userId: input.userId,
          calculatedTransferAmountInMajorUnit: transferAmountInMajorUnit,
          programFinancialServiceProviderConfigurationId:
            input.programFinancialServiceProviderConfigurationId,
          registration,
          oldRegistration,
          isRetry: input.isRetry,
          status: TransactionStatusEnum.error,
          errorText: error?.message,
        });
        return;
      } else {
        throw error;
      }
    }
    // If the transactions was succesful

    let messageType;
    if (intersolveVisaDoTransferOrIssueCardReturnDto.isNewCardCreated) {
      messageType = ProgramNotificationEnum.visaDebitCardCreated;
    } else {
      messageType = ProgramNotificationEnum.visaLoad;
    }
    await this.createMessageAndAddToQueue({
      type: messageType,
      programId: input.programId,
      registration,
      amountTransferred:
        intersolveVisaDoTransferOrIssueCardReturnDto.amountTransferredInMajorUnit,
      bulkSize: input.bulkSize,
      userId: input.userId,
    });

    await this.createTransactionAndUpdateRegistration({
      programId: input.programId,
      paymentNumber: input.paymentNumber,
      userId: input.userId,
      calculatedTransferAmountInMajorUnit:
        intersolveVisaDoTransferOrIssueCardReturnDto.amountTransferredInMajorUnit,
      programFinancialServiceProviderConfigurationId:
        input.programFinancialServiceProviderConfigurationId,
      registration,
      oldRegistration,
      isRetry: input.isRetry,
      status: TransactionStatusEnum.success,
    });
  }

  public async processSafaricomTransactionJob(
    transactionJob: SafaricomTransactionJobDto,
  ): Promise<void> {
    // 1. Get additional data
    const registration = await this.getRegistrationOrThrow(
      transactionJob.referenceId,
    );
    const oldRegistration = structuredClone(registration);

    // 2. Check for existing Safaricom Transfer with the same originatorConversationId, because that means this job has already been (partly) processed. In case of a server crash, jobs that were in process are processed again.
    let safaricomTransfer =
      await this.safaricomTransferScopedRepository.findOne({
        where: {
          originatorConversationId: Equal(
            transactionJob.originatorConversationId,
          ),
        },
      });
    // if no safaricom transfer yet, create a transaction, otherwise this has already happened before
    let transactionId: number;
    if (!safaricomTransfer) {
      const transaction = await this.createTransactionAndUpdateRegistration({
        programId: transactionJob.programId,
        paymentNumber: transactionJob.paymentNumber,
        userId: transactionJob.userId,
        calculatedTransferAmountInMajorUnit: transactionJob.transactionAmount,
        programFinancialServiceProviderConfigurationId:
          transactionJob.programFinancialServiceProviderConfigurationId,
        registration,
        oldRegistration,
        isRetry: transactionJob.isRetry,
        status: TransactionStatusEnum.waiting, // This will only go to 'success' via callback
      });
      transactionId = transaction.id;

      // TODO: combine this with the transaction creation above in one SQL transaction
      const newSafaricomTransfer = new SafaricomTransferEntity();
      newSafaricomTransfer.originatorConversationId =
        transactionJob.originatorConversationId;
      newSafaricomTransfer.transactionId = transactionId;
      safaricomTransfer =
        await this.safaricomTransferScopedRepository.save(newSafaricomTransfer);
    } else {
      transactionId = safaricomTransfer.transactionId;
    }

    // 3. Start the transfer, if failure update to error transaction and return early
    try {
      await this.safaricomService.doTransfer({
        transferAmount: transactionJob.transactionAmount,
        phoneNumber: transactionJob.phoneNumber!,
        idNumber: transactionJob.idNumber!,
        originatorConversationId: transactionJob.originatorConversationId!,
      });
    } catch (error) {
      if (error instanceof DuplicateOriginatorConversationIdError) {
        // Return early, as this job re-attempt has already been processed before, which should not be overwritten
        console.error(error.message);
        return;
      } else if (error instanceof SafaricomApiError) {
        await this.transactionScopedRepository.update(
          { id: transactionId },
          { status: TransactionStatusEnum.error, errorMessage: error?.message },
        );
        return;
      } else {
        throw error;
      }
    }

    // 4. No messages sent for safaricom

    // 5. No transaction stored or updated after API-call, because waiting transaction is already stored earlier and will remain 'waiting' at this stage (to be updated via callback)
  }

  private async getRegistrationOrThrow(
    referenceId: string,
  ): Promise<RegistrationEntity> {
    const registration =
      await this.registrationScopedRepository.getByReferenceId({
        referenceId,
      });
    if (!registration) {
      throw new Error(
        `Registration was not found for referenceId ${referenceId}`,
      );
    }
    return registration;
  }

  private async createTransactionAndUpdateRegistration({
    programId,
    paymentNumber,
    userId,
    calculatedTransferAmountInMajorUnit,
    programFinancialServiceProviderConfigurationId,
    registration,
    oldRegistration,
    isRetry,
    status,
    errorText: errorMessage,
  }: ProcessTransactionResultInput): Promise<TransactionEntity> {
    const resultTransaction = await this.createTransaction({
      amount: calculatedTransferAmountInMajorUnit,
      registration,
      programFinancialServiceProviderConfigurationId,
      programId,
      paymentNumber,
      userId,
      status,
      errorMessage,
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

    return resultTransaction;
  }

  private async addMessageJobToQueue({
    registration,
    userId,
    message,
    bulksize,
  }: {
    registration: RegistrationEntity | Omit<RegistrationViewEntity, 'data'>;
    userId: number;
    message?: string;
    bulksize?: number;
  }): Promise<void> {
    await this.queueMessageService.addMessageJob({
      registration,
      message,
      messageContentType: MessageContentType.payment,
      messageProcessType:
        MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric,
      bulksize,
      userId,
    });
  }

  private async createTransaction({
    amount, // transaction entity are always in major unit
    registration,
    programFinancialServiceProviderConfigurationId,
    programId,
    paymentNumber,
    userId,
    status,
    errorMessage,
  }: {
    amount: number;
    registration: RegistrationEntity;
    programFinancialServiceProviderConfigurationId: number;
    programId: number;
    paymentNumber: number;
    userId: number;
    status: TransactionStatusEnum;
    errorMessage?: string;
  }) {
    const transaction = new TransactionEntity();
    transaction.amount = amount;
    transaction.created = new Date();
    transaction.registration = registration;
    transaction.programFinancialServiceProviderConfigurationId =
      programFinancialServiceProviderConfigurationId;
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

    const paymentCount = await this.latestTransactionRepository.getPaymentCount(
      registration.id,
    );

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
        paymentCount,
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
    userId,
  }: {
    type: ProgramNotificationEnum;
    programId: number;
    registration: RegistrationEntity;
    amountTransferred: number;
    bulkSize: number;
    userId: number;
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
      registration,
      message: messageContent,
      bulksize: bulkSize,
      userId,
    });
  }
}
