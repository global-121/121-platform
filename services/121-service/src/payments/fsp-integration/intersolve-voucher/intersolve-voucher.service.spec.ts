import { TestBed } from '@automock/jest';
import { Queue } from 'bull';
import { FspName } from '../../../fsp/enum/fsp-name.enum';
import { generateMockCreateQueryBuilder } from '../../../utils/createQueryBuilderMock.helper';
import { getQueueName } from '../../../utils/unit-test.helpers';
import { PaPaymentDataDto } from '../../dto/pa-payment-data.dto';
import { ProcessName, QueueNamePayment } from '../../enum/queue.names.enum';
import { IntersolveVoucherJobDto } from './dto/intersolve-voucher-job.dto';
import { IntersolveVoucherService } from './intersolve-voucher.service';

const programId = 3;
const paymentNr = 5;
const mockCredentials = { username: '1234', password: '1234' };
const sendPaymentData = [
  {
    transactionAmount: 22,
    referenceId: '3fc92035-78f5-4b40-a44d-c7711b559442',
    paymentAddress: '14155238886',
    fspName: FspName.intersolveVoucherWhatsapp,
    bulkSize: 1,
  },
] as PaPaymentDataDto[];

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
      { name: 'password', value: '1234' },
      { name: 'username', value: '1234' },
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
      ProcessName.sendPayment,
      paymentDetailsResult,
    );
  });
});
