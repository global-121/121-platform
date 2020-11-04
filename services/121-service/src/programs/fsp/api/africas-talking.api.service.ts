import { StatusEnum } from '../../../shared/enum/status.enum';
import { Injectable } from '@nestjs/common';
import { FspTransactionResultDto } from '../dto/payment-transaction-result';
import { fspName } from '../financial-service-provider.entity';

@Injectable()
export class AfricasTalkingApiService {
  public constructor() {}

  public async sendPayment(payload): Promise<FspTransactionResultDto> {
    const credentials = {
      apiKey: process.env.AFRICASTALKING_API_KEY,
      username: 'sandbox', // process.env.AFRICASTALKING_USERNAME,
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
        // This catch is not working, also errors end up in the above response // UPDATE: is this comment old or still valid?
        console.log('error: ', error);
        result = { error: error };
      });

    const fspTransactionResult = new FspTransactionResultDto();
    fspTransactionResult.fspName = fspName.africasTalking;

    if (result.error) {
      fspTransactionResult.status = StatusEnum.error;
      fspTransactionResult.message = { error: result.error };
    } else if (result.response.errorMessage) {
      fspTransactionResult.status = StatusEnum.error;
      fspTransactionResult.message = {
        error: result.response.errorMessage,
      };
    } else {
      fspTransactionResult.status = StatusEnum.success;
      fspTransactionResult.message = result.response;
    }
    return fspTransactionResult;
  }
}
