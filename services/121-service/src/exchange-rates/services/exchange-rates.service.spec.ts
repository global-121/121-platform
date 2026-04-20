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
    it('should return a map with EUR and all stored rates grouped by currency', async () => {
      mockExchangeRateRepository.find = jest.fn().mockResolvedValue([
        { currency: 'ETB', euroExchangeRate: 59.52, closeTime: '2024-01-15' },
        { currency: 'KES', euroExchangeRate: 155.3, closeTime: '2024-01-15' },
      ]);

      const result = await exchangeRateService.getExchangeRateHistoryMap();

      expect(result.get('ETB')).toEqual([{ rate: 59.52, date: '2024-01-15' }]);
      expect(result.get('KES')).toEqual([{ rate: 155.3, date: '2024-01-15' }]);
    });

    it('should sort rates by date descending per currency', async () => {
      mockExchangeRateRepository.find = jest.fn().mockResolvedValue([
        { currency: 'USD', euroExchangeRate: 0.9, closeTime: '2024-01-10' },
        { currency: 'USD', euroExchangeRate: 0.85, closeTime: '2024-01-20' },
      ]);

      const result = await exchangeRateService.getExchangeRateHistoryMap();

      expect(result.get('USD')).toEqual([
        { rate: 0.85, date: '2024-01-20' },
        { rate: 0.9, date: '2024-01-10' },
      ]);
    });

    it('should return a map with only EUR when no rates are stored', async () => {
      mockExchangeRateRepository.find = jest.fn().mockResolvedValue([]);

      const result = await exchangeRateService.getExchangeRateHistoryMap();

      expect(result.size).toBe(0);
    });
  });

  describe('converting amounts to EUR', () => {
    const txDate = new Date('2024-01-15');

    it('should return the same amount when currency is EUR', () => {
      const result = exchangeRateService.convertToEuro({
        amount: 100,
        fromCurrency: 'EUR',
        transactionDate: txDate,
        exchangeRateMap: new Map(),
      });

      expect(result).toBe(100);
    });

    it('should convert from a local currency to EUR', () => {
      const result = exchangeRateService.convertToEuro({
        amount: 100,
        fromCurrency: 'USD',
        transactionDate: txDate,
        exchangeRateMap: new Map([
          ['USD', [{ rate: 0.9, date: '2024-01-15' }]],
        ]),
      });

      // 100 USD * 0.9 = 90 EUR
      expect(result).toBe(90);
    });

    it('should use the rate from the matching day', () => {
      const result = exchangeRateService.convertToEuro({
        amount: 100,
        fromCurrency: 'USD',
        transactionDate: new Date('2024-01-10'),
        exchangeRateMap: new Map([
          [
            'USD',
            [
              { rate: 0.85, date: '2024-01-20' },
              { rate: 0.9, date: '2024-01-10' },
            ],
          ],
        ]),
      });

      // Uses 0.9 (the rate from 2024-01-10), not 0.85
      expect(result).toBe(90);
    });

    it('should fall back to the most recent rate before the transaction date', () => {
      const result = exchangeRateService.convertToEuro({
        amount: 100,
        fromCurrency: 'USD',
        transactionDate: new Date('2024-01-12'),
        exchangeRateMap: new Map([
          [
            'USD',
            [
              { rate: 0.85, date: '2024-01-20' },
              { rate: 0.9, date: '2024-01-10' },
            ],
          ],
        ]),
      });

      // No rate on 2024-01-12, falls back to 2024-01-10 rate (0.9)
      expect(result).toBe(90);
    });

    it('should return null when fromCurrency is not in the map', () => {
      const result = exchangeRateService.convertToEuro({
        amount: 100,
        fromCurrency: 'USD',
        transactionDate: txDate,
        exchangeRateMap: new Map(),
      });

      expect(result).toBeNull();
    });

    it('should return null when amount is null', () => {
      const result = exchangeRateService.convertToEuro({
        amount: null,
        fromCurrency: 'USD',
        transactionDate: txDate,
        exchangeRateMap: new Map([
          ['USD', [{ rate: 0.9, date: '2024-01-15' }]],
        ]),
      });

      expect(result).toBeNull();
    });

    it('should return null when fromCurrency is null', () => {
      const result = exchangeRateService.convertToEuro({
        amount: 100,
        fromCurrency: null,
        transactionDate: txDate,
        exchangeRateMap: new Map([
          ['USD', [{ rate: 0.9, date: '2024-01-15' }]],
        ]),
      });

      expect(result).toBeNull();
    });

    it('should round the result to 2 decimal places', () => {
      const result = exchangeRateService.convertToEuro({
        amount: 333,
        fromCurrency: 'KES',
        transactionDate: txDate,
        exchangeRateMap: new Map([
          ['KES', [{ rate: 0.007, date: '2024-01-15' }]],
        ]),
      });

      expect(result).toBe(2.33);
    });
  });
});
