import { Injectable } from '@nestjs/common';

import { DoTransferOrIssueCardResult } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/interfaces/do-transfer-or-issue-card-result.interface';
import { IntersolveVisaApiError } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/intersolve-visa-api.error';
import { IntersolveVisaService } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/services/intersolve-visa.service';
import { SaveTransactionProgressAndUpdateRegistrationContext } from '@121-service/src/fsp-integrations/transaction-jobs/interfaces/save-transaction-progress-and-update-registration-context.interface';
import { TransactionJobsHelperService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-helper.service';
import { IntersolveVisaTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/intersolve-visa-transaction-job.dto';
import { FspConfigurationProperties } from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventCreationContext } from '@121-service/src/payments/transactions/transaction-events/interfaces/transaction-event-creation-context.interfac';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';

@Injectable()
export class TransactionJobsIntersolveVisaService {
  constructor(
    private readonly intersolveVisaService: IntersolveVisaService,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly transactionJobsHelperService: TransactionJobsHelperService,
    private readonly transactionRepository: TransactionRepository,
  ) {}

  public async processIntersolveVisaTransactionJob(
    transactionJob: IntersolveVisaTransactionJobDto,
  ): Promise<void> {
    const transactionEventContext: TransactionEventCreationContext = {
      transactionId: transactionJob.transactionId,
      userId: transactionJob.userId,
      programFspConfigurationId: transactionJob.programFspConfigurationId,
    };

    await this.transactionJobsHelperService.createInitiatedOrRetryTransactionEvent(
      {
        context: transactionEventContext,
        isRetry: transactionJob.isRetry,
      },
    );

    const registration =
      await this.transactionJobsHelperService.getRegistrationOrThrow(
        transactionJob.referenceId,
      );

    const saveTransactionProgressAndUpdateRegistrationContext: SaveTransactionProgressAndUpdateRegistrationContext =
      {
        transactionEventContext,
        referenceId: transactionJob.referenceId,
        isRetry: transactionJob.isRetry,
      };
    let transferValueInMajorUnit: number;
    try {
      transferValueInMajorUnit =
        await this.intersolveVisaService.calculateTransferValueWithWalletRetrieval(
          {
            registrationId: registration.id,
            inputTransferValueInMajorUnit: transactionJob.transferValue,
          },
        );
    } catch (error) {
      if (error instanceof IntersolveVisaApiError) {
        // Do not update the transfer value since we were unable to calculate the transfer value. The error message is also clear enough so users should not be confused about the potentially high amount.
        await this.transactionJobsHelperService.saveTransactionProgressAndUpdateRegistration(
          {
            context: saveTransactionProgressAndUpdateRegistrationContext,
            description: TransactionEventDescription.visaPaymentRequested,
            errorMessage: `Error calculating transfer value: ${error?.message}`,
            newTransactionStatus: TransactionStatusEnum.error,
          },
        );
        return;
      }
      throw error;
    }

    // Update the transfer value to the actual transfer value after getting the max allowed by the wallet retrieval due to KYC limits
    await this.updateTransferValue({
      transactionId: transactionJob.transactionId,
      value: transferValueInMajorUnit,
    });

    let intersolveVisaDoTransferOrIssueCardReturnDto: DoTransferOrIssueCardResult;
    try {
      const { brandCode, coverLetterCode, fundingTokenCode } =
        await this.getIntersolveVisaFspConfig(
          transactionJob.programFspConfigurationId,
        );
      intersolveVisaDoTransferOrIssueCardReturnDto =
        await this.intersolveVisaService.doTransferOrIssueCard({
          registrationId: registration.id,
          createCustomerReference: transactionJob.referenceId,
          transferReference: `ReferenceId=${transactionJob.referenceId},TransactionId=${transactionJob.transactionId}`, // Will be used to generate idempotency key for the transfer
          contactInformation: {
            name: transactionJob.name!,
            addressStreet: transactionJob.addressStreet!,
            addressHouseNumber: transactionJob.addressHouseNumber!,
            addressHouseNumberAddition:
              transactionJob.addressHouseNumberAddition,
            addressPostalCode: transactionJob.addressPostalCode!,
            addressCity: transactionJob.addressCity!,
            phoneNumber: transactionJob.phoneNumber!,
          },
          transferValueInMajorUnit,
          brandCode,
          coverLetterCode,
          fundingTokenCode,
        });
    } catch (error) {
      if (error instanceof IntersolveVisaApiError) {
        await this.transactionJobsHelperService.saveTransactionProgressAndUpdateRegistration(
          {
            context: saveTransactionProgressAndUpdateRegistrationContext,
            description: TransactionEventDescription.visaPaymentRequested,
            errorMessage: error?.message,
            newTransactionStatus: TransactionStatusEnum.error,
          },
        );
        return;
      } else {
        throw error;
      }
    }

    // If the transactions was successful
    const messageType =
      intersolveVisaDoTransferOrIssueCardReturnDto.isNewCardCreated
        ? ProgramNotificationEnum.visaDebitCardCreated
        : ProgramNotificationEnum.visaLoad;
    await this.transactionJobsHelperService.createMessageAndAddToQueue({
      type: messageType,
      programId: transactionJob.programId,
      registration,
      amountTransferred:
        intersolveVisaDoTransferOrIssueCardReturnDto.amountTransferredInMajorUnit,
      bulkSize: transactionJob.bulkSize,
      userId: transactionJob.userId,
    });

    await this.transactionJobsHelperService.saveTransactionProgressAndUpdateRegistration(
      {
        context: saveTransactionProgressAndUpdateRegistrationContext,
        description: TransactionEventDescription.visaPaymentRequested,
        newTransactionStatus: TransactionStatusEnum.success,
      },
    );
  }

  private async getIntersolveVisaFspConfig(
    programFspConfigurationId: number,
  ): Promise<{
    brandCode: string;
    coverLetterCode: string;
    fundingTokenCode: string;
  }> {
    const intersolveVisaConfig =
      await this.programFspConfigurationRepository.getPropertiesByNamesOrThrow({
        programFspConfigurationId,
        names: [
          FspConfigurationProperties.brandCode,
          FspConfigurationProperties.coverLetterCode,
          FspConfigurationProperties.fundingTokenCode,
        ],
      });
    return {
      brandCode: intersolveVisaConfig.find(
        (c) => c.name === FspConfigurationProperties.brandCode,
      )?.value as string, // This must be a string. If it is not, the intersolve API will return an error (maybe).
      coverLetterCode: intersolveVisaConfig.find(
        (c) => c.name === FspConfigurationProperties.coverLetterCode,
      )?.value as string, // This must be a string. If it is not, the intersolve API will return an error (maybe).
      fundingTokenCode: intersolveVisaConfig.find(
        (c) => c.name === FspConfigurationProperties.fundingTokenCode,
      )?.value as string, // This must be a string. If it is not, the intersolve API will return an error (maybe).
    };
  }

  private async updateTransferValue({ transactionId, value }) {
    await this.transactionRepository.update(
      { id: transactionId },
      { transferValue: value },
    );
  }
}
