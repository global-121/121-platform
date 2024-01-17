import { TestBed } from '@automock/jest';
import { Queue } from 'bull';
import { PaPaymentDataDto } from '../../../payments/dto/pa-payment-data.dto';
import { getQueueName } from '../../../utils/unit-test.helpers';
import { ProcessName, QueueNamePayment } from '../../enum/queue.names.enum';
import { PaymentDetailsDto } from './dto/payment-details.dto';
import { IntersolveVisaService } from './intersolve-visa.service';

const sendPaymentData = [
  {
    transactionAmount: 22,
    referenceId: '3fc92035-78f5-4b40-a44d-c7711b559442',
    paymentAddress: '14155238886',
    fspName: 'Intersolve-visa',
    bulkSize: 1,
  },
] as PaPaymentDataDto[];
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
  programId: 3,
  referenceId: '40bde7dc-29a9-4af0-81ca-1c426dccdd29',
  transactionAmount: 22,
};
const mockPaPaymentDetails = [
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
    transactionAmount: 22,
  },
] as PaymentDetailsDto[];
const programId = 3;
const paymentNr = 5;

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

    // Act
    await intersolveVisaService.sendPayment(
      sendPaymentData,
      programId,
      paymentNr,
    );

    // Assert
    expect(paymentQueue.add).toHaveBeenCalledTimes(1);
    expect(paymentQueue.add).toHaveBeenCalledWith(
      ProcessName.sendPayment,
      paymentDetailsResult,
    );
  });
});
