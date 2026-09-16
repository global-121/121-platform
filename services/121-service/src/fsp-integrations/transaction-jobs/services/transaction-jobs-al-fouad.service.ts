import { Injectable } from '@nestjs/common';

import {
  AL_FOUAD_CITY_CODE,
  AL_FOUAD_COUNTRY_CODE,
  AL_FOUAD_DELIVERY_CURRENCY_CODE,
} from '@121-service/src/fsp-integrations/integrations/al-fouad/al-fouad.config';
import { AlFouadApiError } from '@121-service/src/fsp-integrations/integrations/al-fouad/errors/al-fouad-api.error';
import { AlFouadService } from '@121-service/src/fsp-integrations/integrations/al-fouad/services/al-fouad.service';
import { TransactionJobService } from '@121-service/src/fsp-integrations/transaction-jobs/interfaces/transaction-job-service.interface';
import { TransactionJobsHelperService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-helper.service';
import { AlFouadTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/al-fouad-transaction-job.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventCreationContext } from '@121-service/src/payments/transactions/transaction-events/interfaces/transaction-event-creation-context.interfac';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';

@Injectable()
export class TransactionJobsAlFouadService
  implements TransactionJobService<AlFouadTransactionJobDto>
{
  public constructor(
    private readonly alFouadService: AlFouadService,
    private readonly transactionJobsHelperService: TransactionJobsHelperService,
    private readonly transactionsService: TransactionsService,
  ) {}

  public async processTransactionJob(
    transactionJob: AlFouadTransactionJobDto,
  ): Promise<void> {
    const context: TransactionEventCreationContext = {
      transactionId: transactionJob.transactionId,
      userId: transactionJob.userId,
      programFspConfigurationId: transactionJob.programFspConfigurationId,
    };

    await this.transactionJobsHelperService.logTransactionJobStart({
      context,
      isRetry: transactionJob.isRetry,
    });

    const referenceNumber = await this.alFouadService.generateReferenceNumber({
      referenceId: transactionJob.referenceId,
      transactionId: transactionJob.transactionId,
    });

    const { authIdentity, senderInfo } =
      await this.alFouadService.getAlFouadFspConfig({
        programFspConfigurationId: transactionJob.programFspConfigurationId,
      });

    try {
      await this.alFouadService.createTransaction({
        senderFullName: senderInfo.senderFullName,
        senderPhoneNumber: senderInfo.senderPhoneNumber,
        beneficiaryFullName: transactionJob.registrationFullName,
        beneficiaryPhoneNumber: transactionJob.registrationPhoneNumber,
        referenceNumber,
        countryCode: AL_FOUAD_COUNTRY_CODE,
        cityCode: AL_FOUAD_CITY_CODE,
        deliveryCurrencyCode: AL_FOUAD_DELIVERY_CURRENCY_CODE,
        deliveryAmount: transactionJob.transferValue,
        authIdentity,
      });
    } catch (error) {
      if (error instanceof AlFouadApiError) {
        await this.transactionsService.saveProgress({
          context,
          description: TransactionEventDescription.alFouadRequestSent,
          errorMessage: error.message,
          newTransactionStatus: TransactionStatusEnum.error,
        });
        return;
      }
      // Timeout / no response: leave the transaction on 'waiting' and let the job fail so it can be retried
      throw error;
    }

    await this.transactionsService.saveProgress({
      context,
      description: TransactionEventDescription.alFouadRequestSent,
    });
  }
}
