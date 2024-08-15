import {
  ProcessNamePayment,
  QueueNamePayment,
} from '@121-service/src/shared/enum/queue-process.names.enum';
import { IntersolveVisaTransactionJobDto } from '@121-service/src/transaction-queues/dto/intersolve-visa-transaction-job.dto';
import { TransactionQueuesService } from '@121-service/src/transaction-queues/transaction-queues.service';
import { getQueueName } from '@121-service/src/utils/unit-test.helpers';
import { TestBed } from '@automock/jest';
import { Queue } from 'bull';

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
  },
];

describe('TransactionQueuesService', () => {
  let transactionQueuesService: TransactionQueuesService;
  let intersolveVisaQueue: jest.Mocked<Queue>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(
      TransactionQueuesService,
    ).compile();

    transactionQueuesService = unit;
    intersolveVisaQueue = unitRef.get(
      getQueueName(QueueNamePayment.paymentIntersolveVisa),
    );
  });

  it('should be defined', () => {
    expect(transactionQueuesService).toBeDefined();
  });

  it('should add transaction job to queue', async () => {
    jest.spyOn(intersolveVisaQueue as any, 'add').mockReturnValue({
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
    expect(intersolveVisaQueue.add).toHaveBeenCalledTimes(1);
    expect(intersolveVisaQueue.add).toHaveBeenCalledWith(
      ProcessNamePayment.sendPayment,
      mockIntersolveVisaTransactionJobDto[0],
    );
  });
});
