import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { PaTransactionResultDto } from '@121-service/src/payments/dto/payment-transaction-result.dto';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import { Injectable } from '@nestjs/common';
import * as africastalking from 'africastalking';

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
    paTransactionResult.fspName = FinancialServiceProviderName.africasTalking;
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
