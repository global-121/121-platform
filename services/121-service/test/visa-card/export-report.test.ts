import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  doPayment,
  exportList,
} from '@121-service/test/helpers/program.helper';
import {
  awaitChangePaStatus,
  getVisaWalletsAndDetails,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Export Visa debit card report', () => {
  const programId = 3;
  const payment = 1;
  const amount = 25;

  const registrationVisa = {
    referenceId: 'registration-visa-export-1',
    preferredLanguage: LanguageEnum.en,
    paymentAmountMultiplier: 1,
    firstName: 'Jane',
    lastName: 'Doe',
    phoneNumber: '14155238887',
    fspName: FinancialServiceProviderName.intersolveVisa,
    whatsappPhoneNumber: '14155238887',
    addressStreet: 'Teststraat',
    addressHouseNumber: '1',
    addressHouseNumberAddition: '',
    addressPostalCode: '1234AB',
    addressCity: 'Stad',
  };

  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
    await waitFor(2_000);
  });

  it('should succesfully generate a report of all Visa Debit cards', async () => {
    // Arrange
    await importRegistrations(programId, [registrationVisa], accessToken);
    await awaitChangePaStatus(
      programId,
      [registrationVisa.referenceId],
      RegistrationStatusEnum.included,
      accessToken,
    );
    const paymentReferenceIds = [registrationVisa.referenceId];
    await doPayment(
      programId,
      payment,
      amount,
      paymentReferenceIds,
      accessToken,
    );

    // Act
    await waitFor(2_000);

    await getVisaWalletsAndDetails(
      programId,
      registrationVisa.referenceId,
      accessToken,
    );

    const exportResult = await exportList(
      programId,
      'card-balances',
      accessToken,
    );

    // Assert
    expect(exportResult.body.fileName).toBe('card-balances');
    // we remove issuedDate and cardNumber, because aways changes
    const {
      issuedDate: _issuedDate,
      cardNumber: _cardNumber,
      ...result
    } = exportResult.body.data[0];
    expect(result).toMatchSnapshot();
  });
});
