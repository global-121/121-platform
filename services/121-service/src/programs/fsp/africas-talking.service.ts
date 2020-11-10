import { Injectable } from '@nestjs/common';
import { AfricasTalkingValidationDto } from './dto/africas-talking-validation.dto';
import { AfricasTalkingNotificationDto } from './dto/africas-talking-notification.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AfricasTalkingNotificationEntity } from './africastalking-notification.entity';
import { Repository } from 'typeorm';
import { AfricasTalkingApiService } from './api/africas-talking.api.service';
import { fspName } from './financial-service-provider.entity';
import { StatusEnum } from '../../shared/enum/status.enum';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
} from './dto/payment-transaction-result.dto';
import { PaPaymentDataDto } from './dto/pa-payment-data.dto';
import { DEBUG } from '../../config';

@Injectable()
export class AfricasTalkingService {
  @InjectRepository(AfricasTalkingNotificationEntity)
  public africasTalkingNotificationRepository: Repository<
    AfricasTalkingNotificationEntity
  >;
  public constructor(
    private readonly africasTalkingApiService: AfricasTalkingApiService,
  ) {}

  public async sendPayment(
    paymentList: PaPaymentDataDto[],
    programId: number,
    installment: number,
    amount: number,
  ): Promise<FspTransactionResultDto> {
    const payload = this.createPayload(
      paymentList,
      programId,
      installment,
      amount,
    );
    const paymentRequestResult = await this.africasTalkingApiService.sendPayment(
      payload,
    );

    const fspTransactionResult = await this.getFsptransactionResult(
      paymentRequestResult,
      paymentList,
      programId,
      installment,
    );

    return fspTransactionResult;
  }

  public createPayload(
    paymentList: PaPaymentDataDto[],
    programId: number,
    installment: number,
    amount: number,
  ): object {
    const payload = {
      username: process.env.AFRICASTALKING_USERNAME,
      productName: process.env.AFRICASTALKING_PRODUCT_NAME,
      recipients: [],
    };

    for (let item of paymentList) {
      const recipient = {
        phoneNumber: item.paymentAddress,
        currencyCode: process.env.AFRICASTALKING_CURRENCY_CODE,
        amount: amount,
        metadata: {
          programId: String(programId),
          installment: String(installment),
          did: String(item.did),
          amount: String(amount),
        },
      };
      payload.recipients.push(recipient);
    }

    return payload;
  }

  private async getFsptransactionResult(
    paymentRequestResult: FspTransactionResultDto,
    paymentList: PaPaymentDataDto[],
    programId: number,
    installment: number,
  ): Promise<FspTransactionResultDto> {
    let fspTransactionResult = new FspTransactionResultDto();
    fspTransactionResult.fspName = fspName.africasTalking;
    fspTransactionResult.paList = [];

    if (paymentRequestResult.status === StatusEnum.success) {
      fspTransactionResult.status = StatusEnum.success;

      for (let transaction of paymentRequestResult.message.entries) {
        // let notification;
        // if (!transaction.errorMessage) {
        //   notification = await this.getNotification(
        //     transaction,
        //     programId,
        //     installment,
        //   );
        // }

        const paTransactionResult = new PaTransactionResultDto();

        const pa = paymentList.find(
          i => i.paymentAddress === transaction.phoneNumber.replace(/\D/g, ''),
        );
        paTransactionResult.did = pa.did;

        paTransactionResult.status = transaction.errorMessage
          ? StatusEnum.error
          : StatusEnum.waiting;

        paTransactionResult.message = transaction.errorMessage
          ? transaction.errorMessage
          : 'No notification of payment status received yet.';

        fspTransactionResult.paList.push(paTransactionResult);
      }
    } else if (paymentRequestResult.status === StatusEnum.error) {
      fspTransactionResult.status = StatusEnum.error;
      for (let pa of paymentList) {
        const paTransactionResult = new PaTransactionResultDto();
        paTransactionResult.did = pa.did;
        paTransactionResult.status = StatusEnum.error;
        paTransactionResult.message =
          'Whole FSP failed: ' + paymentRequestResult.message.error;
        fspTransactionResult.paList.push(paTransactionResult);
      }
    }
    return fspTransactionResult;
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
    paTransactionResult.did = notification.requestMetadata['did'];
    paTransactionResult.status =
      notification.status === 'Failed' ? StatusEnum.error : StatusEnum.success;
    paTransactionResult.message =
      notification.status === 'Failed' ? notification.description : '';

    return {
      paTransactionResult,
      programId: notification.requestMetadata['programId'],
      installment: notification.requestMetadata['installment'],
      amount: Number(notification.requestMetadata['amount']),
    };
  }
}
