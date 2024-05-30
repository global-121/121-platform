import { IntersolveVisaService } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.service';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { TransferJobProcessorIntersolveVisa } from '@121-service/src/transfer-job-processors/processors/intersolve-visa.processor';
import { TestBed } from '@automock/jest';
import { Job } from 'bull';

const mockPaymentJob = {
  referenceId: '40bde7dc-29a9-4af0-81ca-1c426dccdd29',
  phoneNumber: '14155238886',
  preferredLanguage: LanguageEnum.en,
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
  transactionAmount: 25,
  transactionId: 38,
  programId: 3,
  paymentNr: 3,
};
const testJob = { data: mockPaymentJob } as Job;

describe('Payment processor(s)', () => {
  // All message processors are the same, so we only test one
  let intersolveVisaService: jest.Mocked<IntersolveVisaService>;
  let paymentProcessor: TransferJobProcessorIntersolveVisa;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(TransferJobProcessorIntersolveVisa)
      .mock(IntersolveVisaService)
      .using(intersolveVisaService)
      .compile();

    paymentProcessor = unit;
    intersolveVisaService = unitRef.get(IntersolveVisaService);
  });

  it('should call sendQueuePayment', async () => {
    // Arrange
    //intersolveVisaService.processQueuedPayment.mockResolvedValue();
    // TODO: Fix this, according to re-implemented and refactored code.
    //intersolveVisaService.processQueuedPayment.mockResolvedValue(null);

    // Act
    await paymentProcessor.handleSendPayment(testJob);

    // Assert
    // TODO: Fix this, according to re-implemented and refactored code.
    //expect(intersolveVisaService.processQueuedPayment).toHaveBeenCalledTimes(1);
  });
});
