import programOCW from '../../seed-data/program/program-nlrc-ocw.json';
import { WalletStatus121 } from '../../src/payments/fsp-integration/intersolve-visa/enum/wallet-status-121.enum';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../src/shared/enum/program-phase.model';
import { changePhase, doPayment } from '../helpers/program.helper';
import {
  blockVisaCard,
  changePaStatus,
  getMessageHistory,
  getVisaWalletsAndDetails,
  importRegistrations,
  unblockVisaCard,
} from '../helpers/registration.helper';
import { getAccessToken, resetDB, waitFor } from '../helpers/utility.helper';
import {
  amountVisa,
  paymentNrVisa,
  programIdVisa,
  referenceIdVisa,
  registrationVisa,
} from './visa-card.data';

describe('Block visa debit card', () => {
  let accessToken: string;

  beforeEach(async () => {
    await waitFor(1_000);
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
    await waitFor(3_000);

    await changePhase(
      programIdVisa,
      ProgramPhase.registrationValidation,
      accessToken,
    );
    await changePhase(programIdVisa, ProgramPhase.inclusion, accessToken);
    await changePhase(programIdVisa, ProgramPhase.payment, accessToken);
  });

  it('should succesfully block a Visa Debit card', async () => {
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
    const visaWalletResponseBeforeBlock = await getVisaWalletsAndDetails(
      programIdVisa,
      referenceIdVisa,
      accessToken,
    );
    const tokencode = visaWalletResponseBeforeBlock.body.wallets[0].tokenCode;

    const blockVisaResponse = await blockVisaCard(
      programIdVisa,
      tokencode,
      accessToken,
    );

    const visaWalletResponseAfterBlock = await getVisaWalletsAndDetails(
      programIdVisa,
      referenceIdVisa,
      accessToken,
    );

    const messageReponse = await getMessageHistory(
      programIdVisa,
      referenceIdVisa,
      accessToken,
    );
    // Assert
    expect(blockVisaResponse.status).toBe(201);
    expect(blockVisaResponse.body.status).toBe(204);
    expect(visaWalletResponseAfterBlock.body.wallets[0].status).toBe(
      WalletStatus121.Paused,
    );
    const lastMessage = messageReponse.body[0];
    expect(lastMessage.body).toBe(programOCW.notifications.en.blockVisaCard);
  });

  it('should succesfully unblock a Visa Debit card', async () => {
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
    const visaWalletResponseBeforeBlock = await getVisaWalletsAndDetails(
      programIdVisa,
      referenceIdVisa,
      accessToken,
    );
    const tokencode = visaWalletResponseBeforeBlock.body.wallets[0].tokenCode;

    await blockVisaCard(programIdVisa, tokencode, accessToken);
    const unblockVisaResponse = await unblockVisaCard(
      programIdVisa,
      tokencode,
      accessToken,
    );
    const visaWalletResponse = await getVisaWalletsAndDetails(
      programIdVisa,
      referenceIdVisa,
      accessToken,
    );
    const messageReponse = await getMessageHistory(
      programIdVisa,
      referenceIdVisa,
      accessToken,
    );
    // Assert
    expect(unblockVisaResponse.status).toBe(201);
    expect(unblockVisaResponse.body.status).toBe(204);
    expect(visaWalletResponse.body.wallets[0].status).not.toBe(
      WalletStatus121.Blocked,
    );
    const lastMessage = messageReponse.body[0];
    expect(lastMessage.body).toBe(programOCW.notifications.en.unblockVisaCard);
  });
});
