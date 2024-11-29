import { TestBed } from '@automock/jest';

import {
  FinancialServiceProviderConfigurationEnum,
  FinancialServiceProviders,
} from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { IntersolveVoucherJobDto } from '@121-service/src/payments/fsp-integration/intersolve-voucher/dto/intersolve-voucher-job.dto';
import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.service';
import { QueueRegistryService } from '@121-service/src/queue-registry/queue-registry.service';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';
import { generateMockCreateQueryBuilder } from '@121-service/src/utils/createQueryBuilderMock.helper';

const programId = 3;
const paymentNr = 5;
const mockCredentials = { username: '1234', password: '1234' };
const sendPaymentData: PaPaymentDataDto[] = [
  {
    transactionAmount: 22,
    referenceId: '3fc92035-78f5-4b40-a44d-c7711b559442',
    paymentAddress: '14155238886',
    fspName: FinancialServiceProviders.intersolveVoucherWhatsapp,
    bulkSize: 1,
    userId: 1,
  },
];

const paymentDetailsResult: IntersolveVoucherJobDto = {
  paymentInfo: sendPaymentData[0],
  useWhatsapp: true,
  payment: paymentNr,
  credentials: mockCredentials,
  programId,
};

describe('IntersolveVoucherService', () => {
  let intersolveVoucherService: IntersolveVoucherService;
  let queueRegistryService: QueueRegistryService;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(IntersolveVoucherService)
      .mock(QueueRegistryService)
      .using({
        transactionJobIntersolveVoucherQueue: {
          add: jest.fn(),
        },
      })
      .compile();

    intersolveVoucherService = unit;
    queueRegistryService = unitRef.get(QueueRegistryService);
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

    jest
      .spyOn(
        queueRegistryService.transactionJobIntersolveVoucherQueue as any,
        'add',
      )
      .mockReturnValue({
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
    expect(
      queueRegistryService.transactionJobIntersolveVoucherQueue.add,
    ).toHaveBeenCalledTimes(1);
    expect(
      queueRegistryService.transactionJobIntersolveVoucherQueue.add,
    ).toHaveBeenCalledWith(JobNames.default, paymentDetailsResult);
  });
});
