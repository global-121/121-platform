import { Injectable } from '@nestjs/common';

import {
  ALFOUAD_CITY_CODE,
  ALFOUAD_COUNTRY_CODE,
  ALFOUAD_DELIVERY_CURRENCY_CODE,
} from '@121-service/src/fsp-integrations/integrations/alfouad/alfouad.config';
import { AlfouadApiError } from '@121-service/src/fsp-integrations/integrations/alfouad/errors/alfouad-api.error';
import { AlfouadService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.service';
import { TransactionJobService } from '@121-service/src/fsp-integrations/transaction-jobs/interfaces/transaction-job-service.interface';
import { TransactionJobsHelperService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-helper.service';
import { AlfouadTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/alfouad-transaction-job.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventCreationContext } from '@121-service/src/payments/transactions/transaction-events/interfaces/transaction-event-creation-context.interfac';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';

@Injectable()
export class TransactionJobsAlfouadService
  implements TransactionJobService<AlfouadTransactionJobDto>
{
  public constructor(
    private readonly alfouadService: AlfouadService,
    private readonly transactionJobsHelperService: TransactionJobsHelperService,
    private readonly transactionsService: TransactionsService,
  ) {}

  public async processTransactionJob(
    transactionJob: AlfouadTransactionJobDto,
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

    const referenceNumber = await this.alfouadService.generateReferenceNumber({
      referenceId: transactionJob.referenceId,
      transactionId: transactionJob.transactionId,
    });

    const requestIdentity = await this.alfouadService.getAlfouadFspConfig({
      programFspConfigurationId: transactionJob.programFspConfigurationId,
    });

    try {
      await this.alfouadService.createTransaction({
        senderFullName: requestIdentity.senderFullName,
        senderPhoneNumber: requestIdentity.senderPhoneNumber,
        beneficiaryFullName: transactionJob.registrationFullName,
        beneficiaryPhoneNumber: transactionJob.registrationPhoneNumber,
        referenceNumber,
        countryCode: ALFOUAD_COUNTRY_CODE,
        cityCode: ALFOUAD_CITY_CODE,
        deliveryCurrencyCode: ALFOUAD_DELIVERY_CURRENCY_CODE,
        deliveryAmount: transactionJob.transferValue,
        requestIdentity,
      });
    } catch (error) {
      if (error instanceof AlfouadApiError) {
        await this.transactionsService.saveProgress({
          context,
          description: TransactionEventDescription.alfouadRequestSent,
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
      description: TransactionEventDescription.alfouadRequestSent,
    });
  }
}
