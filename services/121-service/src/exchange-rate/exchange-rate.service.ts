import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgramEntity } from '../programs/program.entity';
import { ExchangeRateApiService } from './exchange-rate.api.service';
import { ExchangeRateEntity } from './exchange-rate.entity';

@Injectable()
export class ExchangeRateService {
  @InjectRepository(ExchangeRateEntity)
  private exchangeRateRepository: Repository<ExchangeRateEntity>;
  @InjectRepository(ProgramEntity)
  public programRepository: Repository<ProgramEntity>;

  public constructor(
    private readonly exchangeRateApiService: ExchangeRateApiService,
  ) {}

  public async getAndStoreProgramsExchangeRates(): Promise<void> {
    const currencies = await this.getAllProgramCurrencies();

    for (const currency of currencies) {
      const { rate, closeTime } =
        await this.exchangeRateApiService.retrieveExchangeRate(currency);
      await this.createExchangeRate(currency, Number(rate), closeTime);
    }
  }

  private async createExchangeRate(
    currency: string,
    euroExchangeRate: number,
    closeTime: string,
  ): Promise<void> {
    const exchangeRate = new ExchangeRateEntity();
    exchangeRate.currency = currency;
    exchangeRate.euroExchangeRate = euroExchangeRate;
    exchangeRate.closeTime = closeTime;

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
