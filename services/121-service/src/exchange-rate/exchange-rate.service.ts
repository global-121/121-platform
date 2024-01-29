import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgramEntity } from '../programs/program.entity';
import { ExchangeRateEntity } from './exchange-rate.entity';
import { CustomHttpService } from '../shared/services/custom-http.service';

@Injectable()
export class ExchangeRateService {
  public constructor(
    @InjectRepository(ExchangeRateEntity)
    private exchangeRateRepository: Repository<ExchangeRateEntity>,
    @InjectRepository(ProgramEntity)
    private programRepository: Repository<ProgramEntity>,
    private readonly httpService: CustomHttpService,
  ) {}

  // Public interface for ExchangeRateService:
  // - getAndStoreProgramsExchangeRates
  // nothing else => Tijs gets the data directly from the database (for now)

  public async getAndStoreProgramsExchangeRates(): Promise<void> {
    // Get all currencies used in programs (except EUR)
    // For currency found
    //   Call API to get today's exchange rate
    //   Store retrieved exchange rate

  }

  public async retrieveExchangeRate(): Promise<void> {
    // Test function to try to retrieve an exchange rate via the external API
    // https://fxds-public-exchange-rates-api.oanda.com/cc-api/currencies?base=EUR&quote=USD&data_type=general_currency_pair&start_date=2024-01-23&end_date=2024-01-24
    // Tijs indicated to take "average_bid" from the response

    try {
      const exchangeRateUrl = `http://localhost`;
      //const exchangeRateUrl = `https://fxds-public-exchange-rates-api.oanda.com/cc-api/currencies?base=EUR&quote=USD&data_type=general_currency_pair&start_date=2024-01-23&end_date=2024-01-24`;

      // const headers = [
      //   {
      //     name: 'Authorization',
      //     value: `Bearer ${this.tokenSet.access_token}`,
      //   },
      // ];

      const { data } =
        await this.httpService.post<any>(
          `${exchangeRateUrl}`,
          ``,
        );

      return data;
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
