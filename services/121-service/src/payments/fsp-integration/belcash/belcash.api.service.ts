import { Injectable } from '@nestjs/common';
import { FspName } from '../../../fsp/financial-service-provider.entity';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { PaTransactionResultDto } from '../../dto/payment-transaction-result.dto';

@Injectable()
export class BelcashApiService {
  public constructor() {}

  // NOTE: ALL BELOW IS COPIED FROM AFRICAS-TALKING. THIS MUST BE ADJUSTED TO BELCASH STILL.

  public async sendPaymentPerPa(payload): Promise<PaTransactionResultDto> {
    // A timeout of 123ms to not overload africa's talking server
    await new Promise(r => setTimeout(r, 123));
    const credentials = {
      apiKey: process.env.AFRICASTALKING_API_KEY,
      username: process.env.AFRICASTALKING_USERNAME,
    };
    const Belcash = require('africastalking')(credentials);
    const payments = Belcash.PAYMENTS;

    const paTransactionResult = new PaTransactionResultDto();
    paTransactionResult.fspName = FspName.belcash;
    paTransactionResult.referenceId =
      payload.recipients[0].metadata.referenceId;
    paTransactionResult.date = new Date();
    paTransactionResult.calculatedAmount =
      payload.recipients[0].metadata.amount;

    let result;
    await payments
      .mobileB2C(payload)
      .then((response: any) => {
        result = { response: response };
      })
      .catch((error: any) => {
        console.log('error: ', error);
        result = { error: error };
      });

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
