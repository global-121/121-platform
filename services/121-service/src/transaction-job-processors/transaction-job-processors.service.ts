import { Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { NedbankVoucherStatus } from '@121-service//src/payments/fsp-integration/nedbank/enums/nedbank-voucher-status.enum';
import { EventsService } from '@121-service/src/events/events.service';
import { FinancialServiceProviderConfigurationProperties } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { MessageProcessTypeExtension } from '@121-service/src/notifications/message-job.dto';
import { MessageQueuesService } from '@121-service/src/notifications/message-queues/message-queues.service';
import { MessageTemplateService } from '@121-service/src/notifications/message-template/message-template.service';
import { DoTransferOrIssueCardResult } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/do-transfer-or-issue-card-result.interface';
import { IntersolveVisaService } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.service';
import { IntersolveVisaApiError } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa-api.error';
import { NedbankError } from '@121-service/src/payments/fsp-integration/nedbank/errors/nedbank.error';
import { NedbankService } from '@121-service/src/payments/fsp-integration/nedbank/nedbank.service';
import { NedbankVoucherScopedRepository } from '@121-service/src/payments/fsp-integration/nedbank/repositories/nedbank-voucher.scoped.repository';
import { SafaricomTransferEntity } from '@121-service/src/payments/fsp-integration/safaricom/entities/safaricom-transfer.entity';
import { DuplicateOriginatorConversationIdError } from '@121-service/src/payments/fsp-integration/safaricom/errors/duplicate-originator-conversation-id.error';
import { SafaricomApiError } from '@121-service/src/payments/fsp-integration/safaricom/errors/safaricom-api.error';
import { SafaricomTransferScopedRepository } from '@121-service/src/payments/fsp-integration/safaricom/repositories/safaricom-transfer.scoped.repository';
import { SafaricomService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { LatestTransactionRepository } from '@121-service/src/payments/transactions/repositories/latest-transaction.repository';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { ProgramFinancialServiceProviderConfigurationRepository } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.repository';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { IntersolveVisaTransactionJobDto } from '@121-service/src/transaction-queues/dto/intersolve-visa-transaction-job.dto';
import { NedbankTransactionJobDto } from '@121-service/src/transaction-queues/dto/nedbank-transaction-job.dto';
import { SafaricomTransactionJobDto } from '@121-service/src/transaction-queues/dto/safaricom-transaction-job.dto';
import { shouldBeEnabled } from '@121-service/src/utils/env-variable.helpers';
import { generateUUIDFromSeed } from '@121-service/src/utils/uuid.helpers';

interface ProcessTransactionResultInput {
  programId: number;
  paymentNumber: number;
  userId: number;
  transferAmountInMajorUnit: number;
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
    private readonly nedbankService: NedbankService,
    private readonly messageTemplateService: MessageTemplateService,
    private readonly programFinancialServiceProviderConfigurationRepository: ProgramFinancialServiceProviderConfigurationRepository,
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly safaricomTransferScopedRepository: SafaricomTransferScopedRepository,
    private readonly nedbankVoucherScopedRepository: NedbankVoucherScopedRepository,
    private readonly queueMessageService: MessageQueuesService,
    private readonly transactionScopedRepository: TransactionScopedRepository,
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
          transferAmountInMajorUnit: input.transactionAmountInMajorUnit, // Use the original amount here since we were unable to calculate the transfer amount. The error message is also clear enough so users should not be confused about the potentially high amount.
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

    let intersolveVisaDoTransferOrIssueCardReturnDto: DoTransferOrIssueCardResult;
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
          transferAmountInMajorUnit,
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
      transferAmountInMajorUnit:
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
        transferAmountInMajorUnit: transactionJob.transactionAmount,
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

  public async processNedbankTransactionJob(
    transactionJob: NedbankTransactionJobDto,
  ): Promise<void> {
    // 1. Get the registration to log changes to it later in event table
    const registration = await this.getRegistrationOrThrow(
      transactionJob.referenceId,
    );
    const oldRegistration = structuredClone(registration);

    // 2. Set the payment reference
    // This is a unique identifier for each transaction, which will be shown on the bank statement which the user receives by Nedbank out of the 121-platform
    // It's therefore a human readable identifier, which is unique for each transaction and can be related to the registration and transaction manually
    // Payment reference cannot be longer than 30 characters
    const paymentReferencePrefix =
      (await this.programFinancialServiceProviderConfigurationRepository.getPropertyValueByName(
        {
          programFinancialServiceProviderConfigurationId:
            transactionJob.programFinancialServiceProviderConfigurationId,
          name: FinancialServiceProviderConfigurationProperties.paymentReferencePrefix,
        },
      )) as string; // This must be a string. If it is undefined the validation in payment service should have caught it. If a user set it as an array string you should get an internal server error here, this seems like an edge case;
    const sanitizedPaymentReferencePrefix = paymentReferencePrefix.replace(
      /[^a-zA-Z0-9-]/g,
      '',
    ); // All non-alphanumeric characters (except hyphens) are removed because the nedbank API does not accept them
    const paymentReference = `${sanitizedPaymentReferencePrefix.slice(0, 18)}-${transactionJob.phoneNumber}`;

    // 3. Check if there is an existing voucher/orderCreateReference without status if not create orderCreateReference, the nedbank voucher and the related transaction
    // This should almost never happen, only when we have a server crash or when we got a timeout from the nedbank API when creating the order
    // but if it does, we should use the same orderCreateReference to avoid creating a new voucher
    let orderCreateReference: string;
    let transactionId: number;
    const voucherWithoutStatus =
      await this.nedbankVoucherScopedRepository.getVoucherWhereStatusNull({
        paymentId: transactionJob.paymentNumber,
        registrationId: registration.id,
      });

    if (voucherWithoutStatus) {
      orderCreateReference = voucherWithoutStatus.orderCreateReference;
      transactionId = voucherWithoutStatus.transactionId;
    } else {
      // Create transaction and update registration
      // Note: The transaction is created before the voucher is created, so it can be linked to the generated orderCreateReference
      // before the create voucher order API call to Nedbank is made
      const transaction = await this.createTransactionAndUpdateRegistration({
        programId: transactionJob.programId,
        paymentNumber: transactionJob.paymentNumber,
        userId: transactionJob.userId,
        transferAmountInMajorUnit: transactionJob.transactionAmount,
        programFinancialServiceProviderConfigurationId:
          transactionJob.programFinancialServiceProviderConfigurationId,
        registration,
        oldRegistration,
        isRetry: transactionJob.isRetry,
        status: TransactionStatusEnum.waiting,
      });
      transactionId = transaction.id;

      // Get count of failed transactions to create orderCreateReference
      const failedTransactionsCount =
        await this.transactionScopedRepository.count({
          where: {
            registrationId: Equal(registration.id),
            payment: Equal(transactionJob.paymentNumber),
            status: Equal(TransactionStatusEnum.error),
          },
        });
      // orderCreateReference is generated using: (referenceId + paymentNr + current failed transactions)
      // Using this count to generate the OrderReferenceId ensures that:
      // a. On payment retry, a new reference is generated (needed because a new reference is required by nedbank if a failed order was created).
      // b. Queue Retry: on queue retry, the same OrderReferenceId is generated, which is beneficial because the old successful/failed Order response would be returned.
      orderCreateReference = generateUUIDFromSeed(
        `ReferenceId=${transactionJob.referenceId},PaymentNumber=${transactionJob.paymentNumber},Attempt=${failedTransactionsCount}`,
      ).replace(/^(.{14})5/, '$14');

      // THIS IS MOCK FUNCTIONONALITY FOR TESTING PURPOSES ONLY
      if (
        shouldBeEnabled(process.env.MOCK_NEDBANK) &&
        transactionJob.referenceId.includes('mock')
      ) {
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
    transferAmountInMajorUnit: calculatedTransferAmountInMajorUnit,
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
        await this.eventsService.createFromRegistrationViews(
          {
            id: oldRegistration.id,
            status: oldRegistration.registrationStatus ?? undefined,
          },
          {
            id: registration.id,
            status: registration.registrationStatus ?? undefined,
          },
          {
            explicitRegistrationPropertyNames: ['status'],
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
      message: messageContent ?? undefined,
      bulksize: bulkSize,
      userId,
    });
  }
}
