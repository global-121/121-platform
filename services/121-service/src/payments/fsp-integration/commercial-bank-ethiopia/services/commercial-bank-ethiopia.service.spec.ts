import { TestBed } from '@automock/jest';

import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { CommercialBankEthiopiaJobDto } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/dto/commercial-bank-ethiopia-job.dto';
import { CommercialBankEthiopiaTransferPayload } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/dto/commercial-bank-ethiopia-transfer-payload.dto';
import { CommercialBankEthiopiaService } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/services/commercial-bank-ethiopia.service';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';
import { generateMockCreateQueryBuilder } from '@121-service/src/utils/test-helpers/createQueryBuilderMock.helper';

const programId = 3;
const paymentId = 5;
const userId = 1;
const sendPaymentData: PaPaymentDataDto[] = [
  {
    transactionAmount: 22,
    referenceId: '3fc92035-78f5-4b40-a44d-c7711b559442',
    paymentAddress: '14155238886',
    programFspConfigurationId: 1,
    fspName: Fsps.commercialBankEthiopia,
    bulkSize: 1,
    userId,
  },
];

const payload: CommercialBankEthiopiaTransferPayload[] = [
  {
    debitAmount: sendPaymentData[0].transactionAmount,
    debitTheirRef: '2401193088037336',
    creditTheirRef: 'DRAJointResponse',
    creditAcctNo: '407951684723597',
    creditCurrency: 'ETB',
    remitterName: 'EKHCDC',
    beneficiaryName: 'example name for CBE mock mode',
  },
];

const paymentDetailsResult: CommercialBankEthiopiaJobDto = {
  paPaymentData: sendPaymentData[0],
  paymentId,
  programId,
  payload: payload[0],
  userId: sendPaymentData[0].userId,
};

describe('CommercialBankEthiopiaService', () => {
  let commercialBankEthiopiaService: CommercialBankEthiopiaService;
  let queuesService: QueuesRegistryService;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(CommercialBankEthiopiaService)
      .mock(QueuesRegistryService)
      .using({
        transactionJobCommercialBankEthiopiaQueue: {
          add: jest.fn(),
        },
      })
      .compile();

    commercialBankEthiopiaService = unit;
    queuesService = unitRef.get(QueuesRegistryService);
  });

  it('should be defined', () => {
    expect(commercialBankEthiopiaService).toBeDefined();
  });

  it('should add payment to queue', async () => {
    const dbQueryResult = [
      {
        name: FspConfigurationProperties.username,
        value: '1234',
      },
      {
        name: FspConfigurationProperties.password,
        value: '1234',
      },
    ];
    const createQueryBuilder =
      generateMockCreateQueryBuilder(dbQueryResult);

    jest
      .spyOn(commercialBankEthiopiaService as any, 'getRegistrationData')
      .mockImplementation(() => sendPaymentData[0].referenceId);

    jest
      .spyOn(commercialBankEthiopiaService as any, 'getPaRegistrationData')
      .mockImplementation(() => [sendPaymentData[0], createQueryBuilder]);

    jest
      .spyOn(commercialBankEthiopiaService as any, 'createPayloadPerPa')
      .mockReturnValue(paymentDetailsResult.payload);

    jest
      .spyOn(
        commercialBankEthiopiaService.programFspConfigurationRepository,
        'createQueryBuilder',
      )
      .mockImplementation(() => createQueryBuilder) as any;

    jest
      .spyOn(
        queuesService.transactionJobCommercialBankEthiopiaQueue as any,
        'add',
      )
      .mockReturnValue({
        data: {
          id: 1,
          programId: 3,
        },
      });

    // Act
    await commercialBankEthiopiaService.sendPayment(
      sendPaymentData,
      programId,
      paymentId,
    );

    // Assert
    expect(
      queuesService.transactionJobCommercialBankEthiopiaQueue.add,
    ).toHaveBeenCalledTimes(1);
    expect(
      queuesService.transactionJobCommercialBankEthiopiaQueue.add,
    ).toHaveBeenCalledWith(JobNames.default, paymentDetailsResult);
  });
});
