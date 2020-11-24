import { StatusEnum } from '../../../shared/enum/status.enum';
import { Injectable } from '@nestjs/common';
import { PaTransactionResultDto } from '../dto/payment-transaction-result.dto';

@Injectable()
export class AfricasTalkingApiService {
  public constructor() {}

  public async sendPaymentPerPa(payload): Promise<PaTransactionResultDto> {
    const credentials = {
      apiKey: process.env.AFRICASTALKING_API_KEY,
      username: process.env.AFRICASTALKING_USERNAME,
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
        console.log('error: ', error);
        result = { error: error };
      });

    const paTransactionResult = new PaTransactionResultDto();
    paTransactionResult.did = payload.recipients[0].metadata.did;

    if (result.response?.entries[0]?.errorMessage) {
      paTransactionResult.status = StatusEnum.error;
      paTransactionResult.message = result.response.entries[0].errorMessage;
    } else if (result.response?.errorMessage) {
      paTransactionResult.status = StatusEnum.error;
      paTransactionResult.message = result.response.errorMessage;
    } else if (result.error) {
      paTransactionResult.status = StatusEnum.error;
      paTransactionResult.message = result.error;
    } else {
      paTransactionResult.status = StatusEnum.waiting;
      paTransactionResult.message =
        'No notification of payment status received yet.';
    }
    return paTransactionResult;
  }
}
