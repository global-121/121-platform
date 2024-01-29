import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgramEntity } from '../programs/program.entity';
import { CustomHttpService } from '../shared/services/custom-http.service';
import { ExchangeRateEntity } from './exchange-rate.entity';

@Injectable()
export class ExchangeRateService {
  public constructor(
    @InjectRepository(ExchangeRateEntity)
    private exchangeRateRepository: Repository<ExchangeRateEntity>,
    @InjectRepository(ProgramEntity)
    private programRepository: Repository<ProgramEntity>,
    private readonly httpService: CustomHttpService,
  ) {}

  public async getAndStoreProgramsExchangeRates(): Promise<void> {
    const currencies = await this.getAllProgramCurrencies();

    for (const currency of currencies) {
      const rate = await this.retrieveExchangeRate(currency);
      await this.createExchangeRate(currency, Number(rate));
    }
  }

  private async retrieveExchangeRate(currency: string): Promise<string> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    now.setDate(now.getDate() - 1);
    const yesterday = now.toISOString().split('T')[0];

    const dataKey = 'data';
    const responseKey = 'response';
    const averageBidKey = 'average_bid';

    try {
      const exchangeRateUrl = `https://fxds-public-exchange-rates-api.oanda.com/cc-api/currencies?base=${currency}&quote=EUR&data_type=general_currency_pair&start_date=${yesterday}&end_date=${today}`;
      const data = await this.httpService.get(exchangeRateUrl);

      return data[dataKey][responseKey][0][averageBidKey];
    } catch (error) {
      console.log(error, 'transfer');
      console.error('Failed to make ExchangeRate API call');
      return error.response.data;
    }
  }

  private async createExchangeRate(
    currency: string,
    euroExchangeRate: number,
  ): Promise<void> {
    const exchangeRate = new ExchangeRateEntity();
    exchangeRate.currency = currency;
    exchangeRate.euroExchangeRate = euroExchangeRate;

    await this.exchangeRateRepository.save(exchangeRate);
  }

  private async getAllProgramCurrencies(): Promise<string[]> {
    const euroCode = 'EUR';

    return (
      await this.programRepository
        .createQueryBuilder('program')
        .select('program.currency')
        .where('program.currency != :euroCode', { euroCode })
        .distinct()
        .getRawMany()
    ).map((el) => el.program_currency);
  }
}
