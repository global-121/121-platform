import { Injectable } from '@nestjs/common';

import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { IntersolveVoucherPayoutStatus } from '@121-service/src/payments/fsp-integration/intersolve-voucher/enum/intersolve-voucher-payout-status.enum';
import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/services/intersolve-voucher.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';
import { IntersolveVoucherTransactionJobDto } from '@121-service/src/transaction-queues/dto/intersolve-voucher-transaction-job.dto';

@Injectable()
export class TransactionJobsIntersolveVoucherService {
  constructor(
    private readonly intersolveVoucherService: IntersolveVoucherService,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly transactionJobsHelperService: TransactionJobsHelperService,
  ) {}

  // ##TODO: add unit test for this method
  public async processIntersolveVoucherTransactionJob(
    transactionJob: IntersolveVoucherTransactionJobDto,
  ): Promise<void> {
    const registration =
      await this.transactionJobsHelperService.getRegistrationOrThrow(
        transactionJob.referenceId,
      );

    const credentials =
      await this.programFspConfigurationRepository.getUsernamePasswordProperties(
        transactionJob.programFspConfigurationId,
      );

    const sendIndividualPaymentResult =
      await this.intersolveVoucherService.sendIndividualPayment({
        paymentInfo: {
          referenceId: transactionJob.referenceId,
          paymentAddress: transactionJob.whatsappPhoneNumber,
          transactionAmount: transactionJob.transactionAmount,
          programFspConfigurationId: transactionJob.programFspConfigurationId,
          fspName: Fsps.intersolveVoucherWhatsapp,
          bulkSize: transactionJob.bulkSize,
          userId: transactionJob.userId,
        },
        useWhatsapp: transactionJob.useWhatsapp,
        calculatedAmount: transactionJob.transactionAmount,
        paymentId: transactionJob.paymentId,
        credentials,
      });
    if (!sendIndividualPaymentResult) {
      return;
    }

    await this.transactionJobsHelperService.createTransactionAndUpdateRegistration(
      {
        registration,
        transactionJob,
        transferAmountInMajorUnit: sendIndividualPaymentResult.calculatedAmount,
        status: sendIndividualPaymentResult.status,
        errorText: sendIndividualPaymentResult.message ?? undefined,
        customData: {
          ['IntersolvePayoutStatus']:
            IntersolveVoucherPayoutStatus.InitialMessage,
        },
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
