import { Injectable } from '@nestjs/common';

export interface ExchangeRateApiResponse {
  response: {
    average_bid: string;
    close_time: string;
  }[];
}

@Injectable()
export class ExchangeRatesMockService {
  public async getCurrencies(): Promise<ExchangeRateApiResponse> {
    return {
      response: [
        {
          average_bid: '0.00744368',
          close_time: '2025-01-15T23:59:59Z',
        },
      ],
    };
  }
}
