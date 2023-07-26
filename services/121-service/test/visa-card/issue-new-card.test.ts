import { FspName } from '../../src/fsp/enum/fsp-name.enum';
import { WalletStatus121 } from '../../src/payments/fsp-integration/intersolve-visa/enum/wallet-status-121.enum';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../src/shared/enum/program-phase.model';
import { changePhase, doPayment } from '../helpers/program.helper';
import {
  changePaStatus,
  getVisaWalletsAndDetails,
  importRegistrations,
  issueNewVisaCard,
} from '../helpers/registration.helper';
import { getAccessToken, resetDB, waitFor } from '../helpers/utility.helper';

describe('Issue new Visa debit card', () => {
  const programId = 3;
  const payment = 1;
  const amount = 22;

  const referenceIdVisa = '2982g82bdsf89sdsd';
  const registrationVisa = {
    referenceId: referenceIdVisa,
    preferredLanguage: 'en',
    paymentAmountMultiplier: 1,
    firstName: 'Jane',
    lastName: 'Doe',
    phoneNumber: '14155238887',
    fspName: FspName.intersolveVisa,
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

    await changePhase(
      programId,
      ProgramPhase.registrationValidation,
      accessToken,
    );
    await changePhase(programId, ProgramPhase.inclusion, accessToken);
    await changePhase(programId, ProgramPhase.payment, accessToken);
  });

  it('should succesfully issue a new Visa Debit card', async () => {
    // Arrange
    await importRegistrations(programId, [registrationVisa], accessToken);
    await changePaStatus(programId, [referenceIdVisa], 'include', accessToken);
    const paymentReferenceIds = [referenceIdVisa];
    await doPayment(
      programId,
      payment,
      amount,
      paymentReferenceIds,
      accessToken,
    );

    // Act
    await waitFor(2_000);
    await issueNewVisaCard(programId, referenceIdVisa, accessToken);

    const visaWalletResponse = await getVisaWalletsAndDetails(
      programId,
      referenceIdVisa,
      accessToken,
    );

    // Assert
    expect(visaWalletResponse.body.wallets.length).toBe(2);
    // mock returns hard-coded 'active', while non-mock would return 'inactive', so either way not 'blocked'
    expect(visaWalletResponse.body.wallets[0].status).not.toBe(
      WalletStatus121.Blocked,
    );
    expect(visaWalletResponse.body.wallets[1].status).toBe(
      WalletStatus121.Blocked,
    );
  });
});
