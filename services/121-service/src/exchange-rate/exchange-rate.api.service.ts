import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
interface ExchangeRateApiResponse {
  data: {
    response: {
      average_bid: string;
      close_time: string;
    }[];
  };
}

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

    try {
      const exchangeRateUrl = `https://fxds-public-exchange-rates-api.oanda.com/cc-api/currencies?base=${currency}&quote=EUR&data_type=general_currency_pair&start_date=${yesterday}&end_date=${today}`;
      const response: ExchangeRateApiResponse =
        await this.httpService.get(exchangeRateUrl);

      // Extract the first response
      const data = response.data.response[0];

      // Return rate and closeTime directly
      return { rate: data.average_bid, closeTime: data.close_time };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve exchange rate for ${currency}: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
