import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GetExchangeRateDto } from '@121-service/src/exchange-rates/dtos/get-exchange-rate.dto';
import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import { ExchangeRateEntity } from '@121-service/src/exchange-rates/exchange-rate.entity';
import { ExchangeRatesApiService } from '@121-service/src/exchange-rates/services/exchange-rates.api.service';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';

@Injectable()
export class ExchangeRatesService {
  @InjectRepository(ExchangeRateEntity)
  private exchangeRateRepository: Repository<ExchangeRateEntity>;
  @InjectRepository(ProgramEntity)
  public programRepository: Repository<ProgramEntity>;

  public constructor(
    private readonly exchangeRateApiService: ExchangeRatesApiService,
  ) {}

  public async getAll(): Promise<GetExchangeRateDto[]> {
    return await this.exchangeRateRepository.find({
      select: ['currency', 'euroExchangeRate', 'closeTime'],
    });
  }

  public async retrieveAndStoreAllExchangeRates(): Promise<number> {
    const currencies = await this.getAllProgramCurrencies();

    for (const currency of currencies) {
      const { rate, closeTime } =
        await this.exchangeRateApiService.retrieveExchangeRate(currency);
      await this.createExchangeRate(currency, Number(rate), closeTime);
    }
    return currencies.length;
  }

  private async createExchangeRate(
    currency: CurrencyCode,
    euroExchangeRate: number,
    closeTime: string,
  ): Promise<void> {
    const exchangeRate = new ExchangeRateEntity();
    exchangeRate.currency = currency;
    exchangeRate.euroExchangeRate = euroExchangeRate;
    exchangeRate.closeTime = closeTime;

    await this.exchangeRateRepository.save(exchangeRate);
  }

  private async getAllProgramCurrencies(): Promise<CurrencyCode[]> {
    const euroCode = CurrencyCode.EUR;

    return (
      await this.programRepository
        .createQueryBuilder('program')
        .select('program.currency')
        .where('program.currency != :euroCode', { euroCode })
        .distinct()
        .getRawMany()
    ).map((el) => el.program_currency);
  }

  public async getExchangeRateHistoryMap(): Promise<
    Map<string, { rate: number; date: string }[]>
  > {
    const rates = await this.exchangeRateRepository.find();

    const rateMap = new Map<string, { rate: number; date: string }[]>();

    for (const rate of rates) {
      const date = rate.closeTime?.split('T')[0] ?? '';
      const entries = rateMap.get(rate.currency) ?? [];
      entries.push({ rate: rate.euroExchangeRate, date });
      rateMap.set(rate.currency, entries);
    }

    for (const entries of rateMap.values()) {
      entries.sort((a, b) => b.date.localeCompare(a.date));
    }

    return rateMap;
  }

  public convertToEuro({
    amount,
    fromCurrency,
    transactionDate,
    exchangeRateMap,
  }: {
    amount: number | null;
    fromCurrency: string | null;
    transactionDate: Date;
    exchangeRateMap: Map<string, { rate: number; date: string }[]>;
  }): number | null {
    if (amount == null || fromCurrency == null) {
      return null;
    }

    if (fromCurrency === 'EUR') {
      return Math.round(amount * 100) / 100;
    }

    const rates = exchangeRateMap.get(fromCurrency);
    if (!rates?.length) {
      return null;
    }

    // Find the most recent rate on or before the transaction date
    const txDate = transactionDate.toISOString().split('T')[0];
    const matchingRate = rates.find((r) => r.date <= txDate);
    if (!matchingRate) {
      return null;
    }

    // euroExchangeRate stores "1 unit of local currency = X EUR"
    return Math.round(amount * matchingRate.rate * 100) / 100;
  }
}
