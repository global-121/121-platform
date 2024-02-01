import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgramEntity } from '../programs/program.entity';
import { generateMockCreateQueryBuilder } from '../utils/createQueryBuilderMock.helper';
import { ExchangeRateApiService } from './exchange-rate.api.service';
import { ExchangeRateEntity } from './exchange-rate.entity';
import { ExchangeRateService } from './exchange-rate.service';

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
            createQueryBuilder: jest.fn(() =>
              generateMockCreateQueryBuilder([
                { program_currency: 'GBP' },
                { program_currency: 'USD' },
              ]),
            ),
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
    mockExchangeRateRepository = moduleRef.get(
      getRepositoryToken(ExchangeRateEntity),
    );
  });

  it('should create and save an ExchangeRateEntity', async () => {
    const currency = 'USD';
    const euroExchangeRate = 1.2;
    const closeTime = '2024-01-31';

    await exchangeRateService.createExchangeRate(
      currency,
      euroExchangeRate,
      closeTime,
    );

    expect(mockExchangeRateRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        currency,
        euroExchangeRate,
        closeTime,
      }),
    );
  });

  it('should get all program currencies besides EUR', async () => {
    const result = await exchangeRateService.getAllProgramCurrencies();
    expect(result).toEqual(['GBP', 'USD']);
    expect(result).not.toContain('EUR');
  });
});
