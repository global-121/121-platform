import { Injectable } from '@nestjs/common';

import { FspConfigurationProperties } from '@121-service/src/fsps/enums/fsp-name.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { DoTransferOrIssueCardResult } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/do-transfer-or-issue-card-result.interface';
import { IntersolveVisaService } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.service';
import { IntersolveVisaApiError } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa-api.error';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';
import { IntersolveVisaTransactionJobDto } from '@121-service/src/transaction-queues/dto/intersolve-visa-transaction-job.dto';

@Injectable()
export class TransactionJobsIntersolveVisaService {
  constructor(
    private readonly intersolveVisaService: IntersolveVisaService,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly transactionJobsHelperService: TransactionJobsHelperService,
  ) {}

  public async processIntersolveVisaTransactionJob(
    transactionJob: IntersolveVisaTransactionJobDto,
  ): Promise<void> {
    const registration =
      await this.transactionJobsHelperService.getRegistrationOrThrow(
        transactionJob.referenceId,
      );

    let transferAmountInMajorUnit: number;
    try {
      transferAmountInMajorUnit =
        await this.intersolveVisaService.calculateTransferAmountWithWalletRetrieval(
          {
            registrationId: registration.id,
            inputTransferAmountInMajorUnit:
              transactionJob.transactionAmountInMajorUnit,
          },
        );
    } catch (error) {
      if (error instanceof IntersolveVisaApiError) {
        await this.transactionJobsHelperService.createTransactionAndUpdateRegistration(
          {
            registration,
            transactionJob,
            transferAmountInMajorUnit:
              transactionJob.transactionAmountInMajorUnit, // Use the original amount here since we were unable to calculate the transfer amount. The error message is also clear enough so users should not be confused about the potentially high amount.
            status: TransactionStatusEnum.error,
            errorText: `Error calculating transfer amount: ${error?.message}`,
          },
        );
        return;
      }

      throw error;
    }

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
          transferReference: `ReferenceId=${transactionJob.referenceId},PaymentNumber=${transactionJob.paymentNumber}`,
          name: transactionJob.name!,
          contactInformation: {
            addressStreet: transactionJob.addressStreet!,
            addressHouseNumber: transactionJob.addressHouseNumber!,
            addressHouseNumberAddition:
              transactionJob.addressHouseNumberAddition,
            addressPostalCode: transactionJob.addressPostalCode!,
            addressCity: transactionJob.addressCity!,
            phoneNumber: transactionJob.phoneNumber!,
          },
          transferAmountInMajorUnit,
          brandCode,
          coverLetterCode,
          fundingTokenCode,
        });
    } catch (error) {
      if (error instanceof IntersolveVisaApiError) {
        await this.transactionJobsHelperService.createTransactionAndUpdateRegistration(
          {
            registration,
            transactionJob,
            transferAmountInMajorUnit,
            status: TransactionStatusEnum.error,
            errorText: error?.message,
          },
        );
        return;
      } else {
        throw error;
      }
    }
    // If the transactions was succesful

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

    await this.transactionJobsHelperService.createTransactionAndUpdateRegistration(
      {
        registration,
        transactionJob,
        transferAmountInMajorUnit:
          intersolveVisaDoTransferOrIssueCardReturnDto.amountTransferredInMajorUnit,
        status: TransactionStatusEnum.success,
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
}
