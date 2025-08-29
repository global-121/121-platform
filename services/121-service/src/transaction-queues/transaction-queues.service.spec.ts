import { TestBed } from '@automock/jest';

import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';
import { IntersolveVisaTransactionJobDto } from '@121-service/src/transaction-queues/dto/intersolve-visa-transaction-job.dto';
import { SafaricomTransactionJobDto } from '@121-service/src/transaction-queues/dto/safaricom-transaction-job.dto';
import { TransactionQueuesService } from '@121-service/src/transaction-queues/transaction-queues.service';

const mockIntersolveVisaTransactionJobDto: IntersolveVisaTransactionJobDto[] = [
  {
    projectId: 3,
    userId: 1,
    paymentId: 3,
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
    projectFspConfigurationId: 1,
  },
];

const mockSafaricomTransactionJobDto: SafaricomTransactionJobDto[] = [
  {
    projectId: 3,
    paymentId: 3,
    referenceId: 'a3d1f489-2718-4430-863f-5abc14523691',
    transactionAmount: 25,
    isRetry: false,
    userId: 1,
    bulkSize: 10,
    phoneNumber: '254708374149',
    idNumber: 'nat-123',
    originatorConversationId: 'originator-id',
    projectFspConfigurationId: 1,
  },
];

describe('TransactionQueuesService', () => {
  let transactionQueuesService: TransactionQueuesService;
  let queuesService: QueuesRegistryService;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(TransactionQueuesService)
      .mock(QueuesRegistryService)
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
    queuesService = unitRef.get(QueuesRegistryService);
  });

  it('should be defined', () => {
    expect(transactionQueuesService).toBeDefined();
  });

  it('should add transaction job to queue: intersolve-visa', async () => {
    jest
      .spyOn(queuesService.transactionJobIntersolveVisaQueue as any, 'add')
      .mockReturnValue({
        data: {
          id: 1,
          projectId: 3,
        },
      });

    // Act
    await transactionQueuesService.addIntersolveVisaTransactionJobs(
      mockIntersolveVisaTransactionJobDto,
    );

    // Assert
    expect(
      queuesService.transactionJobIntersolveVisaQueue.add,
    ).toHaveBeenCalledTimes(1);
    expect(
      queuesService.transactionJobIntersolveVisaQueue.add,
    ).toHaveBeenCalledWith(
      JobNames.default,
      mockIntersolveVisaTransactionJobDto[0],
    );
  });

  it('should add transaction job to queue: safaricom', async () => {
    jest
      .spyOn(queuesService.transactionJobSafaricomQueue as any, 'add')
      .mockReturnValue({
        data: {
          id: 1,
          projectId: 3,
        },
      });

    // Act
    await transactionQueuesService.addSafaricomTransactionJobs(
      mockSafaricomTransactionJobDto,
    );

    // Assert
    expect(
      queuesService.transactionJobSafaricomQueue.add,
    ).toHaveBeenCalledTimes(1);
    expect(queuesService.transactionJobSafaricomQueue.add).toHaveBeenCalledWith(
      JobNames.default,
      mockSafaricomTransactionJobDto[0],
    );
  });
});
