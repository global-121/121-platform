import { StatusEnum } from '../../../shared/enum/status.enum';
import { Injectable, HttpService } from '@nestjs/common';
import { AFRICASTALKING } from '../../../secrets';
import { StatusMessageDto } from '../../../shared/dto/status-message.dto';

@Injectable()
export class AfricasTalkingApiService {
  public constructor() {}

  public async sendPaymentMpesa(payload): Promise<StatusMessageDto> {
    const credentials = {
      apiKey: AFRICASTALKING.apiKey,
      username: AFRICASTALKING.username,
    };
    const AfricasTalking = require('africastalking')(credentials);
    const payments = AfricasTalking.PAYMENTS;

    let result;
    await payments
      .mobileB2C(payload)
      .then((response: any) => {
        console.log('response: ', response);
        result = { response: response };
      })
      .catch((error: any) => {
        // This catch is not working, also errors end up in the above response
        console.log('error: ', error);
        result = { error: error };
      });

    return !result.response.errorMessage &&
      !result.response.entries[0].errorMessage
      ? { status: StatusEnum.succes, message: result.response }
      : {
          status: StatusEnum.error,
          message: { error: result.response },
        };
  }
}
