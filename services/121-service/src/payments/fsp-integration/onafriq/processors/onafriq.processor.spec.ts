import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { OnafriqService } from '@121-service/src/payments/fsp-integration/onafriq/onafriq.service';
import { PaymentProcessorOnafriq } from '@121-service/src/payments/fsp-integration/onafriq/processors/onafriq.processor';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { TestBed } from '@automock/jest';
import { Job } from 'bull';

const mockPaymentJob = {
  referenceId: '40bde7dc-29a9-4af0-81ca-1c426dccdd29',
  phoneNumber: '14155238886',
  preferredLanguage: LanguageEnum.en,
  paymentAmountMultiplier: 1,
  firstName: 'Test',
  lastName: 'mock-fail-create-debit-card',
  id: 11,
  fspName: FinancialServiceProviderName.intersolveVoucherWhatsapp,
  paymentAddress: '14155238886',
  transactionAmount: 22,
  transactionId: 38,
  programId: 3,
  paymentNr: 3,
};
const testJob = { data: mockPaymentJob } as Job;

describe('Payment processor(s)', () => {
  // All message processors are the same, so we only test one
  let onafriqService: jest.Mocked<OnafriqService>;
  let paymentProcessor: PaymentProcessorOnafriq;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(PaymentProcessorOnafriq)
      .mock(OnafriqService)
      .using(onafriqService)
      .compile();

    paymentProcessor = unit;
    onafriqService = unitRef.get(OnafriqService);
  });

  it('should call sendQueuePayment', async () => {
    // Arrannge
    onafriqService.processQueuedPayment.mockResolvedValue(null);

    // Act
    await paymentProcessor.handleSendPayment(testJob);

    // Assert
    expect(onafriqService.processQueuedPayment).toHaveBeenCalledTimes(1);
  });
});
