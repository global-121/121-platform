import { TestBed } from '@automock/jest';
import { Job } from 'bull';
import { IntersolveVisaService } from '../intersolve-visa.service';
import { PaymentProcessorIntersolveVisa } from './payment.processor';

const mockPaymentJob = {
  referenceId: '40bde7dc-29a9-4af0-81ca-1c426dccdd29',
  phoneNumber: '14155238886',
  preferredLanguage: 'en',
  paymentAmountMultiplier: 1,
  firstName: 'Test',
  lastName: 'mock-fail-create-debit-card',
  addressStreet: 'Straat',
  addressHouseNumber: '1',
  addressHouseNumberAddition: 'A',
  addressPostalCode: '1234AB',
  addressCity: 'Den Haag',
  id: 11,
  fspName: 'Intersolve-visa',
  paymentAddress: '14155238886',
  transactionAmount: 22,
  transactionId: 38,
  programId: 3,
  paymentNr: 3,
};
const testJob = { data: mockPaymentJob } as Job;

describe('Payment processor(s)', () => {
  // All message processors are the same, so we only test one
  let intersolveVisaService: jest.Mocked<IntersolveVisaService>;
  let paymentProcessor: PaymentProcessorIntersolveVisa;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(PaymentProcessorIntersolveVisa)
      .mock(IntersolveVisaService)
      .using(intersolveVisaService)
      .compile();

    paymentProcessor = unit;
    intersolveVisaService = unitRef.get(IntersolveVisaService);
  });

  it('should call sendQueuePayment', async () => {
    // Arrannge
    intersolveVisaService.processQueuedPayment.mockResolvedValue(null);

    // Act
    await paymentProcessor.handleSendPayment(testJob);

    // Assert
    expect(intersolveVisaService.processQueuedPayment).toHaveBeenCalledTimes(1);
  });
});
