import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinancialServiceProviderName } from '../../../financial-service-provider/enum/financial-service-provider-name.enum';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { PaPaymentDataDto } from '../../dto/pa-payment-data.dto';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
} from '../../dto/payment-transaction-result.dto';
import { TransactionRelationDetailsDto } from '../../dto/transaction-relation-details.dto';
import { TransactionsService } from '../../transactions/transactions.service';
import { FinancialServiceProviderIntegrationInterface } from '../fsp-integration.interface';
import { AfricasTalkingNotificationEntity } from './africas-talking-notification.entity';
import { AfricasTalkingApiService } from './africas-talking.api.service';
import { AfricasTalkingNotificationDto } from './dto/africas-talking-notification.dto';
import { AfricasTalkingValidationDto } from './dto/africas-talking-validation.dto';

@Injectable()
export class AfricasTalkingService
  implements FinancialServiceProviderIntegrationInterface
{
  @InjectRepository(AfricasTalkingNotificationEntity)
  public africasTalkingNotificationRepository: Repository<AfricasTalkingNotificationEntity>;
  public constructor(
    private readonly africasTalkingApiService: AfricasTalkingApiService,
    private readonly transactionsService: TransactionsService,
  ) {}

  public async sendPayment(
    paymentList: PaPaymentDataDto[],
    programId: number,
    paymentNr: number,
  ): Promise<FspTransactionResultDto> {
    const fspTransactionResult = new FspTransactionResultDto();
    fspTransactionResult.paList = [];
    fspTransactionResult.fspName = FinancialServiceProviderName.africasTalking;

    for (const payment of paymentList) {
      const payload = this.createPayloadPerPa(
        payment,
        programId,
        paymentNr,
        payment.transactionAmount,
      );

      const paymentRequestResultPerPa =
        await this.africasTalkingApiService.sendPaymentPerPa(payload);
      fspTransactionResult.paList.push(paymentRequestResultPerPa);
    }

    const transactionRelationDetails: TransactionRelationDetailsDto = {
      programId,
      paymentNr,
      userId: paymentList[0].userId,
    };

    await this.transactionsService.storeAllTransactions(
      fspTransactionResult,
      transactionRelationDetails,
    );

    return fspTransactionResult;
  }

  public async getQueueProgress(_programId: number): Promise<number> {
    // TODO: When this is implemented, remove the '_' from the variable. This is a temporary solution to avoid the linter error.
    throw new Error('Method not implemented.');
  }

  public createPayloadPerPa(
    paymentData: PaPaymentDataDto,
    programId: number,
    payment: number,
    amount: number,
  ): object {
    const payload = {
      username: process.env.AFRICASTALKING_USERNAME,
      productName: process.env.AFRICASTALKING_PRODUCT_NAME,
      recipients: [],
    };

    const recipient = {
      phoneNumber: paymentData.paymentAddress,
      currencyCode: process.env.AFRICASTALKING_CURRENCY_CODE,
      amount: amount,
      metadata: {
        programId: String(programId),
        payment: String(payment),
        referenceId: String(paymentData.referenceId),
        amount: String(amount),
      },
    };
    if (process.env.AFRICASTALKING_PROVIDER_CHANNEL) {
      recipient['providerChannel'] =
        process.env.AFRICASTALKING_PROVIDER_CHANNEL;
    }
    payload.recipients.push(recipient);

    return payload;
  }

  public async checkValidation(
    africasTalkingValidationData: AfricasTalkingValidationDto,
  ): Promise<any> {
    africasTalkingValidationData;
    return {
      status: 'Validated', // 'Validated' or 'Failed'
    };
  }

  public async processNotification(
    africasTalkingNotificationData: AfricasTalkingNotificationDto,
  ): Promise<any> {
    const notification = await this.africasTalkingNotificationRepository.save(
      africasTalkingNotificationData,
    );

    const paTransactionResult = new PaTransactionResultDto();
    paTransactionResult.fspName = FinancialServiceProviderName.africasTalking;
    paTransactionResult.referenceId =
      notification.requestMetadata['referenceId'];
    paTransactionResult.status =
      notification.status === 'Failed' ? StatusEnum.error : StatusEnum.success;
    paTransactionResult.message =
      notification.status === 'Failed' ? notification.description : '';
    paTransactionResult.calculatedAmount = Number(
      notification.requestMetadata['amount'],
    );

    return {
      paTransactionResult,
      programId: notification.requestMetadata['programId'],
      payment: notification.requestMetadata['payment'],
    };
  }

  public async processTransactionStatus(
    africasTalkingNotificationData: AfricasTalkingNotificationDto,
  ): Promise<void> {
    const enrichedNotification = await this.processNotification(
      africasTalkingNotificationData,
    );

    await this.transactionsService.storeTransactionUpdateStatus(
      enrichedNotification.paTransactionResult,
      enrichedNotification.programId,
      enrichedNotification.payment,
    );
  }
}
