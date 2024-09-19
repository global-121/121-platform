import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ExchangeRateApiService } from '@121-service/src/exchange-rate/exchange-rate.api.service';
import { ExchangeRateEntity } from '@121-service/src/exchange-rate/exchange-rate.entity';
import { ExchangeRateService } from '@121-service/src/exchange-rate/exchange-rate.service';
import { ProgramEntity } from '@121-service/src/programs/program.entity';

// Mock for ExchangeRateApiService
const mockExchangeRateApiService = {
  retrieveExchangeRate: jest.fn(),
};

describe('ExchangeRateService', () => {
  let exchangeRateService: ExchangeRateService;
  let mockExchangeRateRepository: jest.Mocked<Repository<ExchangeRateEntity>>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ExchangeRateService,
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
          provide: ExchangeRateApiService,
          useValue: mockExchangeRateApiService,
        },
      ],
    }).compile();

    exchangeRateService =
      moduleRef.get<ExchangeRateService>(ExchangeRateService);
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
    mockExchangeRateApiService.retrieveExchangeRate!.mockResolvedValueOnce({
      rate: USD_euroExchangeRate.toString(),
      closeTime: USD_closeTime,
    });
    mockExchangeRateApiService.retrieveExchangeRate!.mockResolvedValue({
      rate: GBP_euroExchangeRate.toString(),
      closeTime: GBP_closeTime,
    });

    await exchangeRateService.getAndStoreProgramsExchangeRates();

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
