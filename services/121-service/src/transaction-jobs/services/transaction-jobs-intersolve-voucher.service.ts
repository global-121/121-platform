import { Injectable } from '@nestjs/common';

import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/services/intersolve-voucher.service';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { SaveTransactionProgressAndRelatedDataContext } from '@121-service/src/transaction-jobs/interfaces/save-transaction-progress-and-related-data-context.interface';
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
    const transactionEventContext: SaveTransactionProgressAndRelatedDataContext =
      {
        transactionId: transactionJob.transactionId,
        userId: transactionJob.userId,
        programFspConfigurationId: transactionJob.programFspConfigurationId,
        programId: transactionJob.programId,
        referenceId: transactionJob.referenceId,
        isRetry: transactionJob.isRetry,
      };

    await this.transactionJobsHelperService.createInitiatedOrRetryTransactionEvent(
      {
        context: transactionEventContext,
        isRetry: transactionJob.isRetry,
      },
    );

    const credentials =
      await this.programFspConfigurationRepository.getUsernamePasswordProperties(
        transactionJob.programFspConfigurationId,
      );

    // TODO: switch to putting this in a try/catch block, and update to error or waiting based on result, like in other FSPs
    const sendIndividualPaymentResult =
      await this.intersolveVoucherService.sendIndividualPayment({
        referenceId: transactionJob.referenceId,
        useWhatsapp: transactionJob.useWhatsapp,
        whatsappPhoneNumber: transactionJob.whatsappPhoneNumber,
        userId: transactionJob.userId,
        calculatedTransferValue: transactionJob.transferValue,
        transactionId: transactionJob.transactionId,
        bulkSize: transactionJob.bulkSize,
        credentials,
        programFspConfigurationId: transactionJob.programFspConfigurationId,
      });
    if (!sendIndividualPaymentResult) {
      return;
    }

    await this.transactionJobsHelperService.saveTransactionProgressAndUpdateRelatedData(
      {
        context: transactionEventContext,
        description:
          TransactionEventDescription.intersolveVoucherCreationRequest,
        newTransactionStatus: sendIndividualPaymentResult.status,
        errorMessage: sendIndividualPaymentResult.message ?? undefined,
      },
    );
  }
}
