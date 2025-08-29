import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ExchangeRateEntity } from '@121-service/src/exchange-rates/exchange-rate.entity';
import { ExchangeRatesApiService } from '@121-service/src/exchange-rates/exchange-rates.api.service';
import { ExchangeRatesService as ExchangeRatesService } from '@121-service/src/exchange-rates/exchange-rates.service';
import { ProjectEntity } from '@121-service/src/projects/project.entity';

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
          provide: getRepositoryToken(ProjectEntity),
          useValue: {
            createQueryBuilder: jest.fn(() => ({
              select: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              distinct: jest.fn().mockReturnThis(),
              getRawMany: jest
                .fn()
                .mockResolvedValue([
                  { project_currency: 'USD' },
                  { project_currency: 'GBP' },
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
});
