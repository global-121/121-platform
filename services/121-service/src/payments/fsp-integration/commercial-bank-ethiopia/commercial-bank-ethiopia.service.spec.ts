import { TestBed } from '@automock/jest';

import {
  FinancialServiceProviderConfigurationProperties,
  FinancialServiceProviders,
} from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { CommercialBankEthiopiaService } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia.service';
import { CommercialBankEthiopiaJobDto } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/dto/commercial-bank-ethiopia-job.dto';
import { CommercialBankEthiopiaTransferPayload } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/dto/commercial-bank-ethiopia-transfer-payload.dto';
import { QueueRegistryService } from '@121-service/src/queue-registry/queue-registry.service';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';
import { generateMockCreateQueryBuilder } from '@121-service/src/utils/createQueryBuilderMock.helper';

const programId = 3;
const paymentNr = 5;
const userId = 1;
const sendPaymentData: PaPaymentDataDto[] = [
  {
    transactionAmount: 22,
    referenceId: '3fc92035-78f5-4b40-a44d-c7711b559442',
    paymentAddress: '14155238886',
    programFinancialServiceProviderConfigurationId: 1,
    financialServiceProviderName:
      FinancialServiceProviders.commercialBankEthiopia,
    bulkSize: 1,
    userId,
  },
];

const payload: CommercialBankEthiopiaTransferPayload[] = [
  {
    debitAmount: sendPaymentData[0].transactionAmount,
    debitTheIrRef: '2401193088037336',
    creditTheIrRef: 'EKHCDC',
    creditAcctNo: '407951684723597',
    creditCurrency: 'ETB',
    remitterName: 'DRA Joint Response 2023 Ethiopia -',
    beneficiaryName: 'ANDUALEM MOHAMMED YIMER',
  },
];

const paymentDetailsResult: CommercialBankEthiopiaJobDto = {
  paPaymentData: sendPaymentData[0],
  paymentNr,
  programId,
  payload: payload[0],
  userId: sendPaymentData[0].userId,
};

describe('CommercialBankEthiopiaService', () => {
  let commercialBankEthiopiaService: CommercialBankEthiopiaService;
  let queueRegistryService: QueueRegistryService;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(CommercialBankEthiopiaService)
      .mock(QueueRegistryService)
      .using({
        transactionJobCommercialBankEthiopiaQueue: {
          add: jest.fn(),
        },
      })
      .compile();

    commercialBankEthiopiaService = unit;
    queueRegistryService = unitRef.get(QueueRegistryService);
  });

  it('should be defined', () => {
    expect(commercialBankEthiopiaService).toBeDefined();
  });

  it('should add payment to queue', async () => {
    const dbQueryResult = [
      {
        name: FinancialServiceProviderConfigurationProperties.username,
        value: '1234',
      },
      {
        name: FinancialServiceProviderConfigurationProperties.password,
        value: '1234',
      },
    ];
    const createQueryBuilder: any =
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
        queueRegistryService.transactionJobCommercialBankEthiopiaQueue as any,
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
      paymentNr,
    );

    // Assert
    expect(
      queueRegistryService.transactionJobCommercialBankEthiopiaQueue.add,
    ).toHaveBeenCalledTimes(1);
    expect(
      queueRegistryService.transactionJobCommercialBankEthiopiaQueue.add,
    ).toHaveBeenCalledWith(JobNames.default, paymentDetailsResult);
  });
});
