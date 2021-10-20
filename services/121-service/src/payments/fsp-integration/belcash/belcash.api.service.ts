import { HttpService, Injectable } from '@nestjs/common';
import { FspName } from '../../../fsp/financial-service-provider.entity';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { PaTransactionResultDto } from '../../dto/payment-transaction-result.dto';

@Injectable()
export class BelcashApiService {
  public constructor(private readonly httpService: HttpService) {}

  private async authenticate(): Promise<any> {
    const payload = {
      principal: process.env.BELCASH_LOGIN,
      system: process.env.BELCASH_SYSTEM,
      credentials: process.env.BELCASH_PASSWORD,
    };
    const authenticationResult = await this.httpService
      .post(`${process.env.BELCASH_API_URL}/authenticate`, payload)
      .toPromise();
    const headers = {
      // 'Content-Type': 'application/json',
      Authorization: `Bearer ${authenticationResult.data.token}`,
    };
    return headers;
  }

  public async sendPaymentPerPa(
    payload: any,
    referenceId: string,
  ): Promise<PaTransactionResultDto> {
    // A timeout of 100ms to not overload belcash server
    await new Promise(r => setTimeout(r, 100));
    const authenticationHeaders = await this.authenticate();

    const paTransactionResult = new PaTransactionResultDto();
    paTransactionResult.fspName = FspName.belcash;
    paTransactionResult.referenceId = referenceId;
    paTransactionResult.date = new Date();
    paTransactionResult.calculatedAmount = payload.amount;

    // this.httpService
    //   .post(`${process.env.BELCASH_API_URL}/transfers`, payload, {
    //     headers: authenticationHeaders,
    //   })
    //   .subscribe(response => {
    //     console.log('response: ', response);
    //   });

    const paymentRequestResult = await this.httpService
      .post(`${process.env.BELCASH_API_URL}/transfers`, payload, {
        headers: authenticationHeaders,
      })
      .toPromise();
    console.log('paymentRequestResult: ', paymentRequestResult);

    // if (result.response?.entries[0]?.errorMessage) {
    //   paTransactionResult.status = StatusEnum.error;
    //   paTransactionResult.message = result.response.entries[0].errorMessage;
    // } else if (result.response?.errorMessage) {
    //   paTransactionResult.status = StatusEnum.error;
    //   paTransactionResult.message = result.response.errorMessage;
    // } else if (result.error) {
    //   paTransactionResult.status = StatusEnum.error;
    //   paTransactionResult.message = result.error;
    // } else {
    //   paTransactionResult.status = StatusEnum.waiting;
    //   paTransactionResult.message =
    //     'No notification of payment status received yet.';
    // }
    return paTransactionResult;
  }
}
