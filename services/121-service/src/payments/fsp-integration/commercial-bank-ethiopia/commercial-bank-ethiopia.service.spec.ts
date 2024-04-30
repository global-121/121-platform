import { TestBed } from '@automock/jest';
import { Queue } from 'bull';
import {
  FinancialServiceProviderConfigurationEnum,
  FinancialServiceProviderName,
} from '../../../financial-service-provider/enum/financial-service-provider-name.enum';
import { generateMockCreateQueryBuilder } from '../../../utils/createQueryBuilderMock.helper';
import { getQueueName } from '../../../utils/unit-test.helpers';
import { PaPaymentDataDto } from '../../dto/pa-payment-data.dto';
import {
  ProcessNamePayment,
  QueueNamePayment,
} from '../../enum/queue.names.enum';
import { CommercialBankEthiopiaService } from './commercial-bank-ethiopia.service';
import { CommercialBankEthiopiaJobDto } from './dto/commercial-bank-ethiopia-job.dto';
import { CommercialBankEthiopiaTransferPayload } from './dto/commercial-bank-ethiopia-transfer-payload.dto';

const programId = 3;
const paymentNr = 5;
const userId = 1;
const mockCredentials = { username: '1234', password: '1234' };
const sendPaymentData: PaPaymentDataDto[] = [
  {
    transactionAmount: 22,
    referenceId: '3fc92035-78f5-4b40-a44d-c7711b559442',
    paymentAddress: '14155238886',
    fspName: FinancialServiceProviderName.commercialBankEthiopia,
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
  paymentNr: paymentNr,
  programId: programId,
  payload: payload[0],
  credentials: mockCredentials,
  userId: sendPaymentData[0].userId,
};

describe('CommercialBankEthiopiaService', () => {
  let commercialBankEthiopiaService: CommercialBankEthiopiaService;
  let paymentQueue: jest.Mocked<Queue>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(
      CommercialBankEthiopiaService,
    ).compile();

    commercialBankEthiopiaService = unit;
    paymentQueue = unitRef.get(
      getQueueName(QueueNamePayment.paymentCommercialBankEthiopia),
    );
  });

  it('should be defined', () => {
    expect(commercialBankEthiopiaService).toBeDefined();
  });

  it('should add payment to queue', async () => {
    const dbQueryResult = [
      {
        name: FinancialServiceProviderConfigurationEnum.username,
        value: '1234',
      },
      {
        name: FinancialServiceProviderConfigurationEnum.password,
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
      .mockImplementation(() => {
        sendPaymentData[0], createQueryBuilder;
      });

    jest
      .spyOn(commercialBankEthiopiaService as any, 'createPayloadPerPa')
      .mockReturnValue(paymentDetailsResult.payload);

    jest
      .spyOn(
        commercialBankEthiopiaService.programFspConfigurationRepository,
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
    await commercialBankEthiopiaService.sendPayment(
      sendPaymentData,
      programId,
      paymentNr,
    );

    // Assert
    expect(paymentQueue.add).toHaveBeenCalledTimes(1);
    expect(paymentQueue.add).toHaveBeenCalledWith(
      ProcessNamePayment.sendPayment,
      paymentDetailsResult,
    );
  });
});
