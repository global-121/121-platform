import { TestBed } from '@automock/jest';
import { Job } from 'bull';
import { FinancialServiceProviderName } from '../../../../financial-service-provider/enum/financial-service-provider-name.enum';
import { LanguageEnum } from '../../../../registration/enum/language.enum';
import { CommercialBankEthiopiaService } from '../commercial-bank-ethiopia.service';
import { PaymentProcessorCommercialBankEthiopia } from './commercial-bank-ethiopia.processor';

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
  fspName: FinancialServiceProviderName.commercialBankEthiopia,
  paymentAddress: '14155238886',
  transactionAmount: 22,
  transactionId: 38,
  programId: 3,
  paymentNr: 3,
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
    commercialBankEthiopiaService.processQueuedPayment.mockResolvedValue(null);

    // Act
    await paymentProcessor.handleSendPayment(testJob);

    // Assert
    expect(
      commercialBankEthiopiaService.processQueuedPayment,
    ).toHaveBeenCalledTimes(1);
  });
});
