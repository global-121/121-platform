import { Test } from '@nestjs/testing';

import { ExchangeRatesService } from '@121-service/src/exchange-rates/services/exchange-rates.service';
import { InstanceReportingService } from '@121-service/src/instance-reporting/instance-reporting.service';
import { InstanceReportingBlobService } from '@121-service/src/instance-reporting/instance-reporting-blob.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationRepository } from '@121-service/src/registration/repositories/registration.repository';

const mockRegistrationRepository = {
  findForInstanceReporting: jest.fn(),
};

const mockTransactionRepository = {
  findForInstanceReporting: jest.fn(),
};

const mockExchangeRatesService = {
  getExchangeRateMap: jest.fn(),
  convertAmount: jest.fn(),
};

const mockBlobService = {
  uploadReportingData: jest.fn(),
};

describe('InstanceReportingService', () => {
  let service: InstanceReportingService;

  beforeEach(async () => {
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

    jest.resetAllMocks();

    mockTransactionRepository.findForInstanceReporting.mockResolvedValue([]);
    mockRegistrationRepository.findForInstanceReporting.mockResolvedValue([]);
    mockExchangeRatesService.getExchangeRateMap.mockResolvedValue(new Map());
  });

  describe('collecting reporting data', () => {
    describe('registrations', () => {
      it('should fall back to "Program {id}" when titlePortal is null', async () => {
        mockRegistrationRepository.findForInstanceReporting.mockResolvedValue([
          {
            id: 1,
            registrationStatus: RegistrationStatusEnum.included,
            program: { id: 7, titlePortal: null },
          },
        ]);

        const result = await service.getInstanceReportingData();

        expect(result.registrations[0].programTitle).toBe('Program 7');
      });

      it('should include instance, version, and a valid uploadDate', async () => {
        mockRegistrationRepository.findForInstanceReporting.mockResolvedValue([
          {
            id: 1,
            registrationStatus: RegistrationStatusEnum.included,
            program: { id: 1, titlePortal: { en: 'Test' } },
          },
        ]);

        const result = await service.getInstanceReportingData();

        expect(result.registrations[0]).toMatchObject({
          instance: expect.any(String),
          uploadDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          programId: 1,
        });
        expect(result.registrations[0]).toHaveProperty('version');
      });
    });

    describe('transactions', () => {
      const baseTransaction = {
        id: 42,
        status: TransactionStatusEnum.success,
        transferValue: 500,
        created: new Date('2026-01-15T10:00:00Z'),
        updated: new Date('2026-01-15T12:00:00Z'),
        registration: {
          id: 1,
          referenceId: 'REF-001',
          program: { id: 1, currency: 'ETB', titlePortal: { en: 'Test' } },
        },
      };

      it('should pass through null when exchange rate conversion returns null', async () => {
        mockTransactionRepository.findForInstanceReporting.mockResolvedValue([
          baseTransaction,
        ]);
        mockExchangeRatesService.convertAmount.mockReturnValue(null);

        const result = await service.getInstanceReportingData();

        expect(result.transactions[0].amountEuro).toBeNull();
      });

      it('should convert amounts to EUR using the exchange rate map', async () => {
        const exchangeRateMap = new Map([
          ['EUR', 1],
          ['ETB', 60],
        ]);
        mockTransactionRepository.findForInstanceReporting.mockResolvedValue([
          baseTransaction,
        ]);
        mockExchangeRatesService.getExchangeRateMap.mockResolvedValue(
          exchangeRateMap,
        );
        mockExchangeRatesService.convertAmount.mockReturnValueOnce(8.33); // EUR

        const result = await service.getInstanceReportingData();

        expect(result.transactions[0].amountEuro).toBe(8.33);
      });

      it('should map all transaction fields correctly', async () => {
        mockTransactionRepository.findForInstanceReporting.mockResolvedValue([
          baseTransaction,
        ]);
        mockExchangeRatesService.convertAmount.mockReturnValue(100);

        const result = await service.getInstanceReportingData();

        expect(result.transactions[0]).toMatchObject({
          id: 42,
          status: TransactionStatusEnum.success,
          amount: 500,
          amountEuro: 100,
          localCurrency: 'ETB',
          createdDate: '2026-01-15T10:00:00.000Z',
          updatedDate: '2026-01-15T12:00:00.000Z',
          registrationReferenceId: 'REF-001',
          programId: 1,
          programTitle: 'Test',
          uploadDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        });
      });
    });
  });
});
