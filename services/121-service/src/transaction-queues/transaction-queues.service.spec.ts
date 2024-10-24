import { TestBed } from '@automock/jest';

import { QueueRegistryService } from '@121-service/src/queue-registry/queue-registry.service';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';
import { IntersolveVisaTransactionJobDto } from '@121-service/src/transaction-queues/dto/intersolve-visa-transaction-job.dto';
import { SafaricomTransactionJobDto } from '@121-service/src/transaction-queues/dto/safaricom-transaction-job.dto';
import { TransactionQueuesService } from '@121-service/src/transaction-queues/transaction-queues.service';

const mockIntersolveVisaTransactionJobDto: IntersolveVisaTransactionJobDto[] = [
  {
    programId: 3,
    userId: 1,
    paymentNumber: 3,
    referenceId: '40bde7dc-29a9-4af0-81ca-1c426dccdd29',
    transactionAmountInMajorUnit: 25,
    isRetry: false,
    bulkSize: 10,
    name: 'mock-fail-create-debit-card',
    addressStreet: 'Straat',
    addressHouseNumber: '1',
    addressHouseNumberAddition: 'A',
    addressPostalCode: '1234AB',
    addressCity: 'Den Haag',
    phoneNumber: '14155238886',
    programFinancialServiceProviderConfigurationId: 1,
  },
];

const mockSafaricomTransactionJobDto: SafaricomTransactionJobDto[] = [
  {
    programId: 3,
    paymentNumber: 3,
    referenceId: 'a3d1f489-2718-4430-863f-5abc14523691',
    transactionAmount: 25,
    isRetry: false,
    userId: 1,
    bulkSize: 10,
    phoneNumber: '254708374149',
    idNumber: 'nat-123',
    originatorConversationId: 'originator-id',
    programFinancialServiceProviderConfigurationId: 1,
  },
];

describe('TransactionQueuesService', () => {
  let transactionQueuesService: TransactionQueuesService;
  let queueRegistryService: QueueRegistryService;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(TransactionQueuesService)
      .mock(QueueRegistryService)
      .using({
        transactionJobIntersolveVisaQueue: {
          add: jest.fn(),
        },
        transactionJobSafaricomQueue: {
          add: jest.fn(),
        },
      })
      .compile();

    transactionQueuesService = unit;
    queueRegistryService = unitRef.get(QueueRegistryService);
  });

  it('should be defined', () => {
    expect(transactionQueuesService).toBeDefined();
  });

  it('should add transaction job to queue: intersolve-visa', async () => {
    jest
      .spyOn(
        queueRegistryService.transactionJobIntersolveVisaQueue as any,
        'add',
      )
      .mockReturnValue({
        data: {
          id: 1,
          programId: 3,
        },
      });

    // Act
    await transactionQueuesService.addIntersolveVisaTransactionJobs(
      mockIntersolveVisaTransactionJobDto,
    );

    // Assert
    expect(
      queueRegistryService.transactionJobIntersolveVisaQueue.add,
    ).toHaveBeenCalledTimes(1);
    expect(
      queueRegistryService.transactionJobIntersolveVisaQueue.add,
    ).toHaveBeenCalledWith(
      JobNames.default,
      mockIntersolveVisaTransactionJobDto[0],
    );
  });

  it('should add transaction job to queue: safaricom', async () => {
    jest
      .spyOn(queueRegistryService.transactionJobSafaricomQueue as any, 'add')
      .mockReturnValue({
        data: {
          id: 1,
          programId: 3,
        },
      });

    // Act
    await transactionQueuesService.addSafaricomTransactionJobs(
      mockSafaricomTransactionJobDto,
    );

    // Assert
    expect(
      queueRegistryService.transactionJobSafaricomQueue.add,
    ).toHaveBeenCalledTimes(1);
    expect(
      queueRegistryService.transactionJobSafaricomQueue.add,
    ).toHaveBeenCalledWith(JobNames.default, mockSafaricomTransactionJobDto[0]);
  });
});
