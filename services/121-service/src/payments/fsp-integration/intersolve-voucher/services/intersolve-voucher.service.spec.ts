import { TestBed } from '@automock/jest';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { IntersolveVoucherJobDto } from '@121-service/src/payments/fsp-integration/intersolve-voucher/dto/intersolve-voucher-job.dto';
import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/services/intersolve-voucher.service';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';

const projectId = 3;
const paymentId = 5;
const usernameValue = '1234';
const passwordValue = '4567';
const sendPaymentData: PaPaymentDataDto[] = [
  {
    transactionAmount: 22,
    referenceId: '3fc92035-78f5-4b40-a44d-c7711b559442',
    paymentAddress: '14155238886',
    fspName: Fsps.intersolveVoucherWhatsapp,
    projectFspConfigurationId: 1,
    bulkSize: 1,
    userId: 1,
  },
];

const paymentDetailsResult: IntersolveVoucherJobDto = {
  paymentInfo: sendPaymentData[0],
  useWhatsapp: true,
  paymentId,
  projectId,
};

describe('IntersolveVoucherService', () => {
  let intersolveVoucherService: IntersolveVoucherService;
  let queuesService: QueuesRegistryService;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(IntersolveVoucherService)
      .mock(QueuesRegistryService)
      .using({
        transactionJobIntersolveVoucherQueue: {
          add: jest.fn(),
        },
      })
      .compile();

    intersolveVoucherService = unit;
    queuesService = unitRef.get(QueuesRegistryService);
  });

  it('should be defined', () => {
    expect(intersolveVoucherService).toBeDefined();
  });

  it('should add payment to queue', async () => {
    // Arrange
    const useWhatsapp = true;

    const dbQueryResult = {
      username: usernameValue,
      password: passwordValue,
    };

    jest
      .spyOn(
        intersolveVoucherService.projectFspConfigurationRepository,
        'getUsernamePasswordProperties',
      )
      .mockImplementation(() => Promise.resolve(dbQueryResult));

    jest
      .spyOn(queuesService.transactionJobIntersolveVoucherQueue as any, 'add')
      .mockReturnValue({
        data: {
          id: 1,
          projectId: 3,
        },
      });

    // Act
    await intersolveVoucherService.sendPayment(
      sendPaymentData,
      projectId,
      paymentId,
      useWhatsapp,
    );

    // Assert
    expect(
      queuesService.transactionJobIntersolveVoucherQueue.add,
    ).toHaveBeenCalledTimes(1);
    expect(
      queuesService.transactionJobIntersolveVoucherQueue.add,
    ).toHaveBeenCalledWith(JobNames.default, paymentDetailsResult);
  });
});
