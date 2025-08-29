import { TestBed } from '@automock/jest';
import { Job } from 'bull';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { PaymentProcessorCommercialBankEthiopia } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/processors/commercial-bank-ethiopia.processor';
import { CommercialBankEthiopiaService } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/services/commercial-bank-ethiopia.service';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';

const mockPaymentJob = {
  referenceId: '40bde7dc-29a9-4af0-81ca-1c426dccdd29',
  phoneNumber: '14155238886',
  preferredLanguage: LanguageEnum.en,
  paymentAmountMultiplier: 1,
  firstName: 'Test',
  lastName: 'mock-credit-transfer',
  id: 11,
  fspName: Fsps.commercialBankEthiopia,
  paymentAddress: '14155238886',
  transactionAmount: 22,
  transactionId: 38,
  programId: 3,
  paymentId: 3,
};
const testJob = { data: mockPaymentJob } as Job;

describe('Payment processor(s)', () => {
  // All message processors are the same, so we only test one
  let commercialBankEthiopiaService: jest.Mocked<CommercialBankEthiopiaService>;
  let paymentProcessor: PaymentProcessorCommercialBankEthiopia;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(
      PaymentProcessorCommercialBankEthiopia,
    )
      .mock(CommercialBankEthiopiaService)
      .using(commercialBankEthiopiaService)
      .compile();

    paymentProcessor = unit;
    commercialBankEthiopiaService = unitRef.get(CommercialBankEthiopiaService);
  });

  it('should call sendQueuePayment', async () => {
    // Arrannge
    commercialBankEthiopiaService.processQueuedPayment.mockResolvedValue();

    // Act
    await paymentProcessor.handleSendPayment(testJob);

    // Assert
    expect(
      commercialBankEthiopiaService.processQueuedPayment,
    ).toHaveBeenCalledTimes(1);
  });
});
