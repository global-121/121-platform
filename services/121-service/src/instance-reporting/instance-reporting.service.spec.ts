import { Test } from '@nestjs/testing';

import { env } from '@121-service/src/env';
import { ExchangeRatesService } from '@121-service/src/exchange-rates/services/exchange-rates.service';
import { InstanceReportingService } from '@121-service/src/instance-reporting/instance-reporting.service';
import { InstanceReportingBlobService } from '@121-service/src/instance-reporting/instance-reporting-blob.service';
import { TransactionRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { RegistrationRepository } from '@121-service/src/registration/repositories/registration.repository';

jest.mock('@121-service/src/env', () => ({
  env: { ENV_NAME: 'test-instance', NODE_ENV: 'development' },
}));

const mockEnv = env as { ENV_NAME: string | undefined };

const mockRegistrationRepository = {
  findForInstanceReporting: jest.fn(),
};

const mockTransactionRepository = {
  findForInstanceReporting: jest.fn(),
};

const mockExchangeRatesService = {
  getExchangeRateHistoryMap: jest.fn(),
  convertToEuro: jest.fn(),
};

const mockBlobService = {
  uploadReportingData: jest.fn(),
};

describe('InstanceReportingService', () => {
  let service: InstanceReportingService;

  beforeEach(async () => {
    jest.resetAllMocks();

    mockEnv.ENV_NAME = 'test-instance';
    mockTransactionRepository.findForInstanceReporting.mockResolvedValue([]);
    mockRegistrationRepository.findForInstanceReporting.mockResolvedValue([]);
    mockExchangeRatesService.getExchangeRateHistoryMap.mockResolvedValue(
      new Map(),
    );

    const moduleRef = await Test.createTestingModule({
      providers: [
        InstanceReportingService,
        {
          provide: RegistrationRepository,
          useValue: mockRegistrationRepository,
        },
        {
          provide: TransactionRepository,
          useValue: mockTransactionRepository,
        },
        {
          provide: ExchangeRatesService,
          useValue: mockExchangeRatesService,
        },
        {
          provide: InstanceReportingBlobService,
          useValue: mockBlobService,
        },
      ],
    }).compile();

    service = moduleRef.get<InstanceReportingService>(InstanceReportingService);
  });

  describe('getting instance reporting data', () => {
    it('should throw when ENV_NAME is unset', async () => {
      mockEnv.ENV_NAME = '';

      await expect(service.getInstanceReportingData()).rejects.toThrow(
        'ENV_NAME must be set',
      );
    });
  });

  describe('pushing instance reporting data', () => {
    it('should call blob service with reporting data and upload date', async () => {
      await service.pushInstanceReportingData();

      expect(mockBlobService.uploadReportingData).toHaveBeenCalledWith({
        data: { registrations: [], transactions: [] },
        uploadDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      });
    });
  });
});
