import {
  FinancialServiceProviderConfigurationEnum,
  FinancialServiceProviderName,
} from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import {
  ProcessNamePayment,
  QueueNamePayment,
} from '@121-service/src/payments/enum/queue.names.enum';
import { IntersolveVoucherJobDto } from '@121-service/src/payments/fsp-integration/intersolve-voucher/dto/intersolve-voucher-job.dto';
import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.service';
import { generateMockCreateQueryBuilder } from '@121-service/src/utils/createQueryBuilderMock.helper';
import { getQueueName } from '@121-service/src/utils/unit-test.helpers';
import { TestBed } from '@automock/jest';
import { Queue } from 'bull';

const programId = 3;
const paymentNr = 5;
const mockCredentials = { username: '1234', password: '1234' };
const sendPaymentData: PaPaymentDataDto[] = [
  {
    transactionAmount: 22,
    referenceId: '3fc92035-78f5-4b40-a44d-c7711b559442',
    paymentAddress: '14155238886',
    fspName: FinancialServiceProviderName.intersolveVoucherWhatsapp,
    bulkSize: 1,
    userId: 1,
  },
];

const paymentDetailsResult: IntersolveVoucherJobDto = {
  paymentInfo: sendPaymentData[0],
  useWhatsapp: true,
  payment: paymentNr,
  credentials: mockCredentials,
  programId: programId,
};

describe('IntersolveVoucherService', () => {
  let intersolveVoucherService: IntersolveVoucherService;
  let paymentQueue: jest.Mocked<Queue>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(
      IntersolveVoucherService,
    ).compile();

    intersolveVoucherService = unit;
    paymentQueue = unitRef.get(
      getQueueName(QueueNamePayment.paymentIntersolveVoucher),
    );
  });

  it('should be defined', () => {
    expect(intersolveVoucherService).toBeDefined();
  });

  it('should add payment to queue', async () => {
    // Arrange
    const useWhatsapp = true;

    const dbQueryResult = [
      {
        name: FinancialServiceProviderConfigurationEnum.password,
        value: '1234',
      },
      {
        name: FinancialServiceProviderConfigurationEnum.username,
        value: '1234',
      },
    ];
    const createQueryBuilder: any =
      generateMockCreateQueryBuilder(dbQueryResult);

    jest
      .spyOn(
        intersolveVoucherService.programFspConfigurationRepository,
        'createQueryBuilder',
      )
      .mockImplementation(() => createQueryBuilder) as any;

    jest.spyOn(paymentQueue as any, 'add').mockReturnValue({
      data: {
        id: 1,
        programId: 3,
      },
    });

    // Act
    await intersolveVoucherService.sendPayment(
      sendPaymentData,
      programId,
      paymentNr,
      useWhatsapp,
    );

    // Assert
    expect(paymentQueue.add).toHaveBeenCalledTimes(1);
    expect(paymentQueue.add).toHaveBeenCalledWith(
      ProcessNamePayment.sendPayment,
      paymentDetailsResult,
    );
  });
});
