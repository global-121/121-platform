import { WalletStatus121 } from '../../src/payments/fsp-integration/intersolve-visa/enum/wallet-status-121.enum';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../src/shared/enum/program-phase.model';
import { changePhase, doPayment } from '../helpers/program.helper';
import {
  changePaStatus,
  getVisaWalletsAndDetails,
  importRegistrations,
} from '../helpers/registration.helper';
import { getAccessToken, resetDB, waitFor } from '../helpers/utility.helper';
import {
  amountVisa,
  paymentNrVisa,
  programIdVisa,
  referenceIdVisa,
  registrationVisa,
} from './visa-card.data';

describe('Load Visa debit cards and details', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
    await waitFor(2_000);

    await changePhase(
      programIdVisa,
      ProgramPhase.registrationValidation,
      accessToken,
    );
    await changePhase(programIdVisa, ProgramPhase.inclusion, accessToken);
    await changePhase(programIdVisa, ProgramPhase.payment, accessToken);
  });

  it('should succesfully show a Visa Debit card', async () => {
    // Arrange
    await importRegistrations(programIdVisa, [registrationVisa], accessToken);
    await changePaStatus(
      programIdVisa,
      [referenceIdVisa],
      'include',
      accessToken,
    );
    const paymentReferenceIds = [referenceIdVisa];
    await doPayment(
      programIdVisa,
      paymentNrVisa,
      amountVisa,
      paymentReferenceIds,
      accessToken,
    );

    // Act
    await waitFor(2_000);
    const visaWalletResponse = await getVisaWalletsAndDetails(
      programIdVisa,
      referenceIdVisa,
      accessToken,
    );

    // Assert
    expect(visaWalletResponse.body.wallets).toBeDefined();
    expect(visaWalletResponse.body.wallets.length).toBe(1);
    expect(visaWalletResponse.body.wallets[0].tokenCode).toBeDefined();
    expect(visaWalletResponse.body.wallets[0].balance).toBeDefined();
    expect(Object.keys(WalletStatus121)).toContain(
      visaWalletResponse.body.wallets[0].status,
    );
    expect(visaWalletResponse.body.wallets[0].issuedDate).toBeDefined();
    expect(visaWalletResponse.body.wallets[0].lastUsedDate).toBeDefined();
  });
});
