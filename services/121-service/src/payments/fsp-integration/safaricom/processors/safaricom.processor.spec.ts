import { TestBed } from '@automock/jest';
import { Job } from 'bull';
import { FspName } from '../../../../fsp/enum/fsp-name.enum';
import { LanguageEnum } from '../../../../registration/enum/language.enum';
import { SafaricomService } from '../safaricom.service';
import { PaymentProcessorSafaricom } from './safaricom.processor';

const mockPaymentJob = {
  referenceId: '40bde7dc-29a9-4af0-81ca-1c426dccdd29',
  phoneNumber: '14155238886',
  preferredLanguage: LanguageEnum.en,
  paymentAmountMultiplier: 1,
  firstName: 'Test',
  lastName: 'mock-fail-create-debit-card',
  id: 11,
  fspName: FspName.intersolveVoucherWhatsapp,
  paymentAddress: '14155238886',
  transactionAmount: 22,
  transactionId: 38,
  programId: 3,
  paymentNr: 3,
};
const testJob = { data: mockPaymentJob } as Job;

describe('Payment processor(s)', () => {
  // All message processors are the same, so we only test one
  let safaricomService: jest.Mocked<SafaricomService>;
  let paymentProcessor: PaymentProcessorSafaricom;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(PaymentProcessorSafaricom)
      .mock(SafaricomService)
      .using(safaricomService)
      .compile();

    paymentProcessor = unit;
    safaricomService = unitRef.get(SafaricomService);
  });

  it('should call sendQueuePayment', async () => {
    // Arrannge
    safaricomService.processQueuedPayment.mockResolvedValue(null);

    // Act
    await paymentProcessor.handleSendPayment(testJob);

    // Assert
    expect(safaricomService.processQueuedPayment).toHaveBeenCalledTimes(1);
  });
});
