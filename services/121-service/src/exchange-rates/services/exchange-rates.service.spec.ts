import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ExchangeRateEntity } from '@121-service/src/exchange-rates/exchange-rate.entity';
import { ExchangeRatesApiService } from '@121-service/src/exchange-rates/services/exchange-rates.api.service';
import { ExchangeRatesService } from '@121-service/src/exchange-rates/services/exchange-rates.service';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';

// Mock for ExchangeRateApiService
const mockExchangeRatesApiService = {
  retrieveExchangeRate: jest.fn(),
};

describe('ExchangeRatesService', () => {
  let exchangeRateService: ExchangeRatesService;
  let mockExchangeRateRepository: jest.Mocked<Repository<ExchangeRateEntity>>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ExchangeRatesService,
        {
          provide: getRepositoryToken(ExchangeRateEntity),
          useValue: {
            save: jest.fn().mockResolvedValue(new ExchangeRateEntity()),
          },
        },
        {
          provide: getRepositoryToken(ProgramEntity),
          useValue: {
            createQueryBuilder: jest.fn(() => ({
              select: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              distinct: jest.fn().mockReturnThis(),
              getRawMany: jest
                .fn()
                .mockResolvedValue([
                  { program_currency: 'USD' },
                  { program_currency: 'GBP' },
                ]),
            })),
          },
        },
        {
          provide: ExchangeRatesApiService,
          useValue: mockExchangeRatesApiService,
        },
      ],
    }).compile();

    exchangeRateService =
      moduleRef.get<ExchangeRatesService>(ExchangeRatesService);
    mockExchangeRateRepository = moduleRef.get<
      jest.Mocked<Repository<ExchangeRateEntity>>
    >(getRepositoryToken(ExchangeRateEntity));
  });

  it('should call retrieveExchangeRate and save ExchangeRateEntity', async () => {
    const USD_currency = 'USD';
    const GBP_currency = 'GBP';
    const USD_euroExchangeRate = 1.2;
    const GBP_euroExchangeRate = 1.5;
    const USD_closeTime = '2024-01-31';
    const GBP_closeTime = '2024-01-30';

    // Mocking API responses for retrieveExchangeRate
    mockExchangeRatesApiService.retrieveExchangeRate!.mockResolvedValueOnce({
      rate: USD_euroExchangeRate.toString(),
      closeTime: USD_closeTime,
    });
    mockExchangeRatesApiService.retrieveExchangeRate!.mockResolvedValue({
      rate: GBP_euroExchangeRate.toString(),
      closeTime: GBP_closeTime,
    });

    await exchangeRateService.retrieveAndStoreAllExchangeRates();

    // Expectations for repository save calls
    expect(mockExchangeRateRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: USD_currency,
        euroExchangeRate: USD_euroExchangeRate,
        closeTime: USD_closeTime,
      }),
    );
    expect(mockExchangeRateRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: GBP_currency,
        euroExchangeRate: GBP_euroExchangeRate,
        closeTime: GBP_closeTime,
      }),
    );
  });

  describe('getting exchange rate map', () => {
    it('should return a map with EUR set to 1 and all stored rates', async () => {
      mockExchangeRateRepository.find = jest.fn().mockResolvedValue([
        { currency: 'ETB', euroExchangeRate: 59.52 },
        { currency: 'KES', euroExchangeRate: 155.3 },
      ]);

      const result = await exchangeRateService.getExchangeRateMap();

      expect(result).toEqual(
        new Map([
          ['EUR', 1],
          ['ETB', 59.52],
          ['KES', 155.3],
        ]),
      );
    });

    it('should return a map with only EUR when no rates are stored', async () => {
      mockExchangeRateRepository.find = jest.fn().mockResolvedValue([]);

      const result = await exchangeRateService.getExchangeRateMap();

      expect(result.get('EUR')).toBe(1);
      expect(result.size).toBe(1);
    });
  });

  describe('converting amounts between currencies', () => {
    it('should return the same amount when currencies are equal', () => {
      const result = exchangeRateService.convertAmount({
        amount: 100,
        fromCurrency: 'EUR',
        toCurrency: 'EUR',
        exchangeRateMap: new Map(),
      });

      expect(result).toBe(100);
    });

    it('should convert from one currency to another via EUR', () => {
      // euroExchangeRate means "1 unit of local currency = X EUR"
      const exchangeRateMap = new Map([
        ['EUR', 1],
        ['USD', 0.9],
        ['GBP', 1.2],
      ]);

      // 100 USD * 0.9 = 90 EUR
      const result = exchangeRateService.convertAmount({
        amount: 100,
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        exchangeRateMap,
      });

      expect(result).toBe(90);
    });

    it('should convert between two non-EUR currencies', () => {
      // euroExchangeRate means "1 unit of local currency = X EUR"
      const exchangeRateMap = new Map([
        ['EUR', 1],
        ['USD', 0.9],
        ['GBP', 1.2],
      ]);

      // 100 USD * 0.9 = 90 EUR / 1.2 = 75 GBP
      const result = exchangeRateService.convertAmount({
        amount: 100,
        fromCurrency: 'USD',
        toCurrency: 'GBP',
        exchangeRateMap,
      });

      expect(result).toBe(75);
    });

    it('should return null when fromCurrency is not in the map', () => {
      const exchangeRateMap = new Map([
        ['EUR', 1],
        ['GBP', 1.2],
      ]);

      const result = exchangeRateService.convertAmount({
        amount: 100,
        fromCurrency: 'USD',
        toCurrency: 'GBP',
        exchangeRateMap,
      });

      expect(result).toBeNull();
    });

    it('should return null when toCurrency is not in the map', () => {
      const exchangeRateMap = new Map([
        ['EUR', 1],
        ['USD', 0.9],
      ]);

      const result = exchangeRateService.convertAmount({
        amount: 100,
        fromCurrency: 'USD',
        toCurrency: 'GBP',
        exchangeRateMap,
      });

      expect(result).toBeNull();
    });

    it('should round the result to 2 decimal places', () => {
      // euroExchangeRate means "1 unit of local currency = X EUR"
      const exchangeRateMap = new Map([
        ['EUR', 1],
        ['USD', 0.9],
        ['GBP', 1.17],
      ]);

      // 100 USD * 0.9 = 90 EUR / 1.17 = 76.923... GBP
      const result = exchangeRateService.convertAmount({
        amount: 100,
        fromCurrency: 'USD',
        toCurrency: 'GBP',
        exchangeRateMap,
      });

      expect(result).toBe(76.92);
    });
  });
});
