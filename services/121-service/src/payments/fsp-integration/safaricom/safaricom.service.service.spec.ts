import { TestBed } from '@automock/jest';
import { Queue } from 'bull';
import { FspName } from '../../../fsp/enum/fsp-name.enum';
import { getQueueName } from '../../../utils/unit-test.helpers';
import { PaPaymentDataDto } from '../../dto/pa-payment-data.dto';
import { ProcessName, QueueNamePayment } from '../../enum/queue.names.enum';
import { SafaricomJobDto } from './dto/safaricom-job.dto';
import { SafaricomService } from './safaricom.service';

const programId = 3;
const paymentNr = 5;
const userId = 1;

const sendPaymentData: PaPaymentDataDto[] = [
  {
    transactionAmount: 22,
    referenceId: '3fc92035-78f5-4b40-a44d-c7711b559442',
    paymentAddress: '14155238886',
    fspName: FspName.safaricom,
    bulkSize: 1,
    userId: userId,
  },
];

const paymentDetailsResult: SafaricomJobDto = {
  userInfo: [
    {
      id: '5',
      referenceId: 'bbe2ea6e-3711-4677-b82f-2f0081054d14',
      value: '32121321',
    },
  ],
  paPaymentData: sendPaymentData[0],
  programId: programId,
  paymentNr: paymentNr,
  userId: userId,
};

describe('SafaricomService', () => {
  let safaricomService: SafaricomService;
  let paymentQueue: jest.Mocked<Queue>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(SafaricomService).compile();

    safaricomService = unit;
    paymentQueue = unitRef.get(getQueueName(QueueNamePayment.paymentSafaricom));
  });

  it('should be defined', () => {
    expect(safaricomService).toBeDefined();
  });

  it('should add payment to queue', async () => {
    jest
      .spyOn(safaricomService as any, 'getUserInfo')
      .mockImplementation(() => paymentDetailsResult.userInfo);

    jest.spyOn(paymentQueue as any, 'add').mockReturnValue({
      data: {
        id: 1,
        programId: 3,
      },
    });

    // Act
    await safaricomService.sendPayment(sendPaymentData, programId, paymentNr);

    // Assert
    expect(paymentQueue.add).toHaveBeenCalledTimes(1);
    expect(paymentQueue.add).toHaveBeenCalledWith(
      ProcessName.sendPayment,
      paymentDetailsResult,
    );
  });
});
