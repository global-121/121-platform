import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import {
  ProcessNamePayment,
  QueueNamePayment,
} from '@121-service/src/payments/enum/queue.names.enum';
import { OnafriqJobDto } from '@121-service/src/payments/fsp-integration/onafriq/dto/onafriq-job.dto';
import { OnafriqService } from '@121-service/src/payments/fsp-integration/onafriq/onafriq.service';
import { getQueueName } from '@121-service/src/utils/unit-test.helpers';
import { TestBed } from '@automock/jest';
import { Queue } from 'bull';

const programId = 3;
const paymentNr = 5;
const userId = 1;

const sendPaymentData: PaPaymentDataDto[] = [
  {
    transactionAmount: 22,
    referenceId: '3fc92035-78f5-4b40-a44d-c7711b559442',
    paymentAddress: '14155238886',
    fspName: FinancialServiceProviderName.onafriq,
    bulkSize: 1,
    userId: userId,
  },
];

const paymentDetailsResult: OnafriqJobDto = {
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

describe('OnafriqService', () => {
  let onafriqService: OnafriqService;
  let paymentQueue: jest.Mocked<Queue>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(OnafriqService).compile();

    onafriqService = unit;
    paymentQueue = unitRef.get(getQueueName(QueueNamePayment.paymentOnafriq));
  });

  it('should be defined', () => {
    expect(onafriqService).toBeDefined();
  });

  it('should add payment to queue', async () => {
    jest
      .spyOn(onafriqService as any, 'getUserInfo')
      .mockImplementation(() => paymentDetailsResult.userInfo);

    jest.spyOn(paymentQueue as any, 'add').mockReturnValue({
      data: {
        id: 1,
        programId: 3,
      },
    });

    // Act
    await onafriqService.sendPayment(sendPaymentData, programId, paymentNr);

    // Assert
    expect(paymentQueue.add).toHaveBeenCalledTimes(1);
    expect(paymentQueue.add).toHaveBeenCalledWith(
      ProcessNamePayment.sendPayment,
      paymentDetailsResult,
    );
  });
});
