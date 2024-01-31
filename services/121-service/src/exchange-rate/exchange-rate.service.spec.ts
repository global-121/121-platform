import { TestBed } from '@automock/jest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { generateMockCreateQueryBuilder } from '../utils/createQueryBuilderMock.helper';
import { ExchangeRateEntity } from './exchange-rate.entity';
import { ExchangeRateService } from './exchange-rate.service';

describe('ExchangeRateService', () => {
  let exchangeRateService: ExchangeRateService;
  let mockExchangeRateRepository: Repository<ExchangeRateEntity>;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(ExchangeRateService).compile();
    exchangeRateService = unit;

    mockExchangeRateRepository = unitRef.get(
      getRepositoryToken(ExchangeRateEntity) as any,
    );
  });

  describe('getAllProgramCurrencies', () => {
    it('should get all program currencies besdes EUR', async () => {
      const mockQueryBuilder = generateMockCreateQueryBuilder([
        {
          program_currency: 'GBP',
        },
        {
          program_currency: 'USD',
        },
      ]);

      jest
        .spyOn(
          exchangeRateService.programRepository as any,
          'createQueryBuilder',
        )
        .mockImplementation(() => mockQueryBuilder) as any;

      const result: string[] =
        await exchangeRateService.getAllProgramCurrencies();
      expect(result).not.toContain('EUR');
    });
  });

  describe('createExchangeRate', () => {
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
  });
});
