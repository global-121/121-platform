import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GetExchangeRateDto } from '@121-service/src/exchange-rates/dtos/get-exchange-rate.dto';
import { ExchangeRateEntity } from '@121-service/src/exchange-rates/exchange-rate.entity';
import { ExchangeRatesApiService } from '@121-service/src/exchange-rates/exchange-rates.api.service';
import { ProjectEntity } from '@121-service/src/programs/project.entity';

@Injectable()
export class ExchangeRatesService {
  @InjectRepository(ExchangeRateEntity)
  private exchangeRateRepository: Repository<ExchangeRateEntity>;
  @InjectRepository(ProjectEntity)
  public programRepository: Repository<ProjectEntity>;

  public constructor(
    private readonly exchangeRateApiService: ExchangeRatesApiService,
  ) {}

  public async getAll(): Promise<GetExchangeRateDto[]> {
    return await this.exchangeRateRepository.find({
      select: ['currency', 'euroExchangeRate', 'closeTime'],
    });
  }

  public async retrieveAndStoreAllExchangeRates(): Promise<void> {
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
