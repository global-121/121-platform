import { Injectable } from '@nestjs/common';
import * as africastalking from 'africastalking';
import { FspName } from '../../../fsp/enum/fsp-name.enum';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { waitFor } from '../../../utils/waitFor.helper';
import { PaTransactionResultDto } from '../../dto/payment-transaction-result.dto';

@Injectable()
export class AfricasTalkingApiService {
  public async sendPaymentPerPa(payload): Promise<PaTransactionResultDto> {
    // Wait to not overload the africa's talking server
    await waitFor(123);
    const credentials = {
      apiKey: process.env.AFRICASTALKING_API_KEY,
      username: process.env.AFRICASTALKING_USERNAME,
    };
    const AfricasTalking = africastalking(credentials);
    const payments = AfricasTalking.PAYMENTS;

    const paTransactionResult = new PaTransactionResultDto();
    paTransactionResult.fspName = FspName.africasTalking;
    paTransactionResult.referenceId =
      payload.recipients[0].metadata.referenceId;
    paTransactionResult.date = new Date();
    paTransactionResult.calculatedAmount =
      payload.recipients[0].metadata.amount;

    const result = await payments
      .mobileB2C(payload)
      .then((response: any) => {
        return { response: response };
      })
      .catch((error: any) => {
        console.log('error: ', error);
        return { error: error };
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
