import { ContainerClient } from '@azure/storage-blob';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ExchangeRateEntity } from '@121-service/src/exchange-rates/exchange-rate.entity';
import { MonitoringDataService } from '@121-service/src/monitoring-data/monitoring-data.service';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';

describe('MonitoringDataService', () => {
  let service: MonitoringDataService;
  let registrationRepository: jest.Mocked<Repository<RegistrationEntity>>;
  let transactionRepository: jest.Mocked<Repository<TransactionEntity>>;
  let exchangeRateRepository: jest.Mocked<Repository<ExchangeRateEntity>>;
  let containerClient: jest.Mocked<ContainerClient>;
  const uploadData = jest.fn();

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-31T01:00:00.000Z'));
    const moduleRef = await Test.createTestingModule({
      providers: [
        MonitoringDataService,
        {
          provide: getRepositoryToken(RegistrationEntity),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TransactionEntity),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ExchangeRateEntity),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: ContainerClient,
          useValue: {
            getBlockBlobClient: jest.fn().mockReturnValue({
              uploadData,
            }),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(MonitoringDataService);
    registrationRepository = moduleRef.get(getRepositoryToken(RegistrationEntity));
    transactionRepository = moduleRef.get(getRepositoryToken(TransactionEntity));
    exchangeRateRepository = moduleRef.get(getRepositoryToken(ExchangeRateEntity));
    containerClient = moduleRef.get(ContainerClient);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  it('should map and upload registrations and transactions to dated blob paths', async () => {
    const registrationQueryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          status: 'included',
          programId: 12,
          programTitlePortal: { en: 'Cash Program' },
        },
      ]),
    };
    jest
      .spyOn(registrationRepository, 'createQueryBuilder')
      .mockReturnValue(registrationQueryBuilder as any);

    const transactionQueryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          id: 1001,
          status: 'success',
          amount: 10,
          localCurrency: 'USD',
          createdDate: new Date('2026-03-30T10:00:00.000Z'),
          updatedDate: new Date('2026-03-30T11:00:00.000Z'),
          registrationReferenceId: 'PA-0001',
          programId: 12,
          programTitlePortal: { en: 'Cash Program' },
        },
      ]),
    };
    jest
      .spyOn(transactionRepository, 'createQueryBuilder')
      .mockReturnValue(transactionQueryBuilder as any);

    const exchangeRatesQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        { currency: 'USD', euroExchangeRate: 0.9 },
        { currency: 'CHF', euroExchangeRate: 1.2 },
      ]),
    };
    jest
      .spyOn(exchangeRateRepository, 'createQueryBuilder')
      .mockReturnValue(exchangeRatesQueryBuilder as any);

    const result = await service.pushMonitoringDataToCentralStorage();

    expect(containerClient.getBlockBlobClient).toHaveBeenCalledWith(
      '2026-03-30/registrations/unknown.json',
    );
    expect(containerClient.getBlockBlobClient).toHaveBeenCalledWith(
      '2026-03-30/transactions/unknown.json',
    );
    expect(result.registrations).toEqual([
      {
        instance: 'unknown',
        version: 'unknown',
        programTitle: 'Cash Program',
        programId: 12,
        status: 'included',
        uploadDate: '2026-03-30',
      },
    ]);
    expect(result.transactions).toEqual([
      {
        instance: 'unknown',
        version: 'unknown',
        programId: 12,
        programTitle: 'Cash Program',
        id: 1001,
        status: 'success',
        amountEuro: 9,
        amountChf: 7.5,
        amount: 10,
        localCurrency: 'USD',
        createdDate: '2026-03-30T10:00:00.000Z',
        updatedDate: '2026-03-30T11:00:00.000Z',
        registrationReferenceId: 'PA-0001',
        uploadDate: '2026-03-30',
      },
    ]);
  });
});
