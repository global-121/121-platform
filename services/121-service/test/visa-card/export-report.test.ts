import { FspName } from '../../src/fsp/enum/fsp-name.enum';
import { WalletStatus121 } from '../../src/payments/fsp-integration/intersolve-visa/enum/wallet-status-121.enum';
import { RegistrationStatusEnum } from '../../src/registration/enum/registration-status.enum';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../src/shared/enum/program-phase.model';
import {
  changePhase,
  doPayment,
  getVisaReport,
} from '../helpers/program.helper';
import {
  changePaStatus,
  getVisaWalletsAndDetails,
  importRegistrations,
} from '../helpers/registration.helper';
import { getAccessToken, resetDB, waitFor } from '../helpers/utility.helper';

describe('Export Visa debit card report', () => {
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

  it('should succesfully generate a report of all Visa Debit cards', async () => {
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

    await getVisaWalletsAndDetails(programId, referenceIdVisa, accessToken);

    const exportResult = await getVisaReport(programId, accessToken);

    // Assert
    expect(exportResult.body.fileName).toBe('card-balances');
    expect(exportResult.body.data[0].cardStatus121).toBe(
      WalletStatus121.Active,
    );
    expect(exportResult.body.data[0].balance).toBe(2200);
    expect(exportResult.body.data[0].registrationStatus).toBe(
      RegistrationStatusEnum.included,
    );
    expect(exportResult.body.data[0].paId).toBeGreaterThan(0);
    expect(exportResult.body.data[0].issuedDate).toBeDefined();
    expect(exportResult.body.data[0].lastUsedDate).toBeDefined();
    expect(exportResult.body.data[0].referenceId).toBeDefined();
    expect(exportResult.body.data[0].cardNumber).toBeDefined();
  });
});
