import { Injectable } from '@nestjs/common';

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
        referenceId: transactionJob.referenceId,
        useWhatsapp: transactionJob.useWhatsapp,
        whatsappPhoneNumber: transactionJob.whatsappPhoneNumber,
        userId: transactionJob.userId,
        calculatedAmount: transactionJob.transactionAmount,
        paymentId: transactionJob.paymentId,
        bulkSize: transactionJob.bulkSize,
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
}
