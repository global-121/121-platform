import { StatusMessageDto } from './../../shared/dto/status-message.dto';
import { AfricasTalkingApiService } from './api/africas-talking.api.service';
import { Injectable } from '@nestjs/common';
import { INTERSOLVE, AFRICASTALKING } from '../../secrets';
import { AfricasTalkingValidationDto } from './dto/africas-talking-validation.dto';

@Injectable()
export class AfricasTalkingService {
  public constructor(
    private readonly AfricasTalkingApiService: AfricasTalkingApiService,
  ) {}

  public async sendPayment(paymentList: any[]): Promise<StatusMessageDto> {
    console.log('paymentList: ', paymentList);
    const payload = this.createAfricasTalkingDetails(paymentList);
    return await this.AfricasTalkingApiService.sendPaymentMpesa(payload);
  }

  public createAfricasTalkingDetails(paymentList: any[]): object {
    const payload = {
      username: AFRICASTALKING.username,
      productName: AFRICASTALKING.productName,
      recipients: [],
    };

    for (let item of paymentList) {
      const recipient = {
        phoneNumber: item.phoneNumber, // '+254711123466',
        currencyCode: AFRICASTALKING.currencyCode,
        amount: item.amount,
        metadata: {},
      };
      payload.recipients.push(recipient);
    }

    return payload;
  }

  public async africasTalkingValidation(
    africasTalkingValidationData: AfricasTalkingValidationDto,
  ): Promise<any> {
    return {
      status: 'Validated', // 'Validated' or 'Failed'
    };
  }
}
