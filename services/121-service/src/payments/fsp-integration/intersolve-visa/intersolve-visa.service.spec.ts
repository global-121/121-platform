import { TestBed } from '@automock/jest';
import { Queue } from 'bull';
import { FinancialServiceProviderName } from '../../../financial-service-provider/enum/financial-service-provider-name.enum';
import { PaPaymentDataDto } from '../../../payments/dto/pa-payment-data.dto';
import { getQueueName } from '../../../utils/unit-test.helpers';
import {
  ProcessNamePayment,
  QueueNamePayment,
} from '../../enum/queue.names.enum';
import { PaymentDetailsDto } from './dto/payment-details.dto';
import { IntersolveVisaService } from './intersolve-visa.service';

const programId = 3;
const paymentNr = 5;
const sendPaymentData: PaPaymentDataDto[] = [
  {
    transactionAmount: 25,
    referenceId: '3fc92035-78f5-4b40-a44d-c7711b559442',
    paymentAddress: '14155238886',
    fspName: FinancialServiceProviderName.intersolveVisa,
    bulkSize: 1,
    userId: 1,
  },
];
const paymentDetailsResult: PaymentDetailsDto = {
  addressCity: 'Den Haag',
  addressHouseNumber: '1',
  addressHouseNumberAddition: 'A',
  addressPostalCode: '1234AB',
  addressStreet: 'Straat',
  bulkSize: 1,
  firstName: 'Test',
  lastName: 'mock-fail-create-debit-card',
  paymentNr: 5,
  phoneNumber: '14155238886',
  programId: programId,
  referenceId: '40bde7dc-29a9-4af0-81ca-1c426dccdd29',
  transactionAmount: 25,
  userId: 1,
};
const mockPaPaymentDetails: PaymentDetailsDto[] = [
  {
    referenceId: '40bde7dc-29a9-4af0-81ca-1c426dccdd29',
    phoneNumber: '14155238886',
    firstName: 'Test',
    lastName: 'mock-fail-create-debit-card',
    addressStreet: 'Straat',
    addressHouseNumber: '1',
    addressHouseNumberAddition: 'A',
    addressPostalCode: '1234AB',
    addressCity: 'Den Haag',
    transactionAmount: 25,
    userId: 1,
    programId: programId,
    paymentNr: paymentNr,
    bulkSize: 1,
  },
];

describe('IntersolveVisaService', () => {
  let intersolveVisaService: IntersolveVisaService;
  let paymentQueue: jest.Mocked<Queue>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(IntersolveVisaService).compile();

    intersolveVisaService = unit;
    paymentQueue = unitRef.get(
      getQueueName(QueueNamePayment.paymentIntersolveVisa),
    );
  });

  it('should be defined', () => {
    expect(intersolveVisaService).toBeDefined();
  });

  it('should add payment to queue', async () => {
    jest
      .spyOn(intersolveVisaService as any, 'getPaPaymentDetails')
      .mockResolvedValue(mockPaPaymentDetails);

    jest.spyOn(paymentQueue as any, 'add').mockReturnValue({
      data: {
        id: 1,
        programId: 3,
      },
    });

    // Act
    await intersolveVisaService.sendPayment(
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
