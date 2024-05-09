import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.service';
import { PaymentProcessorIntersolveVoucher } from '@121-service/src/payments/fsp-integration/intersolve-voucher/processors/intersolve-voucher.processor';
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
  let intersolveVoucherService: jest.Mocked<IntersolveVoucherService>;
  let paymentProcessor: PaymentProcessorIntersolveVoucher;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(PaymentProcessorIntersolveVoucher)
      .mock(IntersolveVoucherService)
      .using(intersolveVoucherService)
      .compile();

    paymentProcessor = unit;
    intersolveVoucherService = unitRef.get(IntersolveVoucherService);
  });

  it('should call sendQueuePayment', async () => {
    // Arrannge
    intersolveVoucherService.processQueuedPayment.mockResolvedValue();

    // Act
    await paymentProcessor.handleSendPayment(testJob);

    // Assert
    expect(intersolveVoucherService.processQueuedPayment).toHaveBeenCalledTimes(
      1,
    );
  });
});
