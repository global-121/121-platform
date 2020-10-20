import { StatusEnum } from '../../../shared/enum/status.enum';
import { Injectable, HttpService } from '@nestjs/common';
import { StatusMessageDto } from '../../../shared/dto/status-message.dto';

@Injectable()
export class AfricasTalkingApiService {
  public constructor() {}

  public async sendPaymentMpesa(payload): Promise<StatusMessageDto> {
    const credentials = {
      apiKey: process.env.AFRICASTALKING_API_KEY,
      username: process.env.AFRICASTALKING_USERNAME
    };
    const AfricasTalking = require('africastalking')(credentials);
    const payments = AfricasTalking.PAYMENTS;

    let result;
    await payments
      .mobileB2C(payload)
      .then((response: any) => {
        console.log('response africastalking: ', response);
        result = { response: response };
      })
      .catch((error: any) => {
        // This catch is not working, also errors end up in the above response
        console.log('error: ', error);
        result = { error: error };
      });

    if (result.error) {
      return { status: StatusEnum.error, message: { error: result.error } };
    } else if (result.response.errorMessage) {
      return {
        status: StatusEnum.error,
        message: { error: result.response.errorMessage },
      };
    } else {
      return { status: StatusEnum.success, message: result.response };
    }
  }
}
