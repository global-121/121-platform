import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FspName } from '../../../fsp/financial-service-provider.entity';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { PaPaymentDataDto } from '../../dto/pa-payment-data.dto';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
} from '../../dto/payment-transaction-result.dto';
import { TransactionsService } from '../../transactions/transactions.service';
import { AfricasTalkingNotificationEntity } from './africas-talking-notification.entity';
import { AfricasTalkingApiService } from './africas-talking.api.service';
import { AfricasTalkingNotificationDto } from './dto/africas-talking-notification.dto';
import { AfricasTalkingValidationDto } from './dto/africas-talking-validation.dto';

@Injectable()
export class AfricasTalkingService {
  @InjectRepository(AfricasTalkingNotificationEntity)
  public africasTalkingNotificationRepository: Repository<
    AfricasTalkingNotificationEntity
  >;
  public constructor(
    private readonly africasTalkingApiService: AfricasTalkingApiService,
    private readonly transactionsService: TransactionsService,
  ) {}

  public async sendPayment(
    paymentList: PaPaymentDataDto[],
    programId: number,
    paymentNr: number,
    amount: number,
  ): Promise<FspTransactionResultDto> {
    const fspTransactionResult = new FspTransactionResultDto();
    fspTransactionResult.paList = [];
    fspTransactionResult.fspName = FspName.africasTalking;

    for (let payment of paymentList) {
      const calculatedAmount = amount * (payment.paymentAmountMultiplier || 1);
      const payload = this.createPayloadPerPa(
        payment,
        programId,
        paymentNr,
        calculatedAmount,
      );

      const paymentRequestResultPerPa = await this.africasTalkingApiService.sendPaymentPerPa(
        payload,
      );
      fspTransactionResult.paList.push(paymentRequestResultPerPa);
    }
    this.transactionsService.storeAllTransactions(
      fspTransactionResult,
      programId,
      paymentNr,
    );

    return fspTransactionResult;
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
    paTransactionResult.fspName = FspName.africasTalking;
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

    this.transactionsService.storeTransaction(
      enrichedNotification.paTransactionResult,
      enrichedNotification.programId,
      enrichedNotification.payment,
    );
  }
}
