import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import {
  ProcessNamePayment,
  QueueNamePayment,
} from '@121-service/src/payments/enum/queue.names.enum';
import { SafaricomJobDto } from '@121-service/src/payments/fsp-integration/safaricom/dto/safaricom-job.dto';
import { SafaricomService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.service';
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
    fspName: FinancialServiceProviderName.safaricom,
    bulkSize: 1,
    userId: userId,
  },
];

const paymentDetailsResult: SafaricomJobDto = {
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
      ProcessNamePayment.sendPayment,
      paymentDetailsResult,
    );
  });
});
