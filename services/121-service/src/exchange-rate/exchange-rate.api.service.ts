import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class ExchangeRateApiService {
  public constructor(private readonly httpService: CustomHttpService) {}

  public async retrieveExchangeRate(
    currency: string,
  ): Promise<{ rate: string; closeTime: string }> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    now.setDate(now.getDate() - 1);
    const yesterday = now.toISOString().split('T')[0];

    const dataKey = 'data';
    const responseKey = 'response';
    const averageBidKey = 'average_bid';
    const closeTimeKey = 'close_time';

    try {
      const exchangeRateUrl = `https://fxds-public-exchange-rates-api.oanda.com/cc-api/currencies?base=${currency}&quote=EUR&data_type=general_currency_pair&start_date=${yesterday}&end_date=${today}`;
      const data = ((await this.httpService.get(exchangeRateUrl)) as any)[
        dataKey
      ][responseKey][0];

      return { rate: data[averageBidKey], closeTime: data[closeTimeKey] };
    } catch (error) {
      throw new HttpException(
        `Failed to make ExchangeRate API call: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
