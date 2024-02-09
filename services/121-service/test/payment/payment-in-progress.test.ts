import { SeedScript } from '../../src/scripts/seed-script.enum';
import { registrationsPV } from '../fixtures/scoped-registrations';
import {
  doPayment,
  getProgramPaymentsStatus,
  retryPayment,
  waitForPaymentTransactionsToComplete,
} from '../helpers/program.helper';
import { seedIncludedRegistrations } from '../helpers/registration.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';
import {
  programIdOCW,
  programIdPV,
  registrationsOCW,
} from '../registrations/pagination/pagination-data';

describe('Test payment in progress', () => {
  const OcwProgramId = programIdOCW;
  const PvProgramId = programIdPV;

  const payment = 1;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    await seedIncludedRegistrations(registrationsOCW, OcwProgramId);
    await seedIncludedRegistrations(registrationsPV, PvProgramId);
  });

  it('payment should not be in progress after payment', async () => {
    const accessToken = await getAccessToken();
    // Arrange
    const paymentNr = 1;

    // We do a payment here and wait for it to complete
    const result = await doPayment(
      PvProgramId,
      paymentNr,
      25,
      [],
      accessToken,
      {
        'filter.status': '$in:included',
      },
    );
    await waitForPaymentTransactionsToComplete(
      programIdPV,
      registrationsPV.map((r) => r.referenceId),
      accessToken,
      10_000,
    );

    // Act
    const getProgramPaymentsPvResult = (
      await getProgramPaymentsStatus(programIdPV, accessToken)
    ).body;
    const getProgramPaymentsOcwResult = (
      await getProgramPaymentsStatus(programIdOCW, accessToken)
    ).body;

    const doPaymentPvResultPaymentNext = await doPayment(
      PvProgramId,
      paymentNr + 1,
      25,
      [],
      accessToken,
      {
        'filter.status': '$in:included',
      },
    );
    const doPaymentOcwResultPaymentNext = await doPayment(
      OcwProgramId,
      paymentNr,
      25,
      [],
      accessToken,
      {
        'filter.status': '$in:included',
      },
    );

    // Assert
    // Nothing should be in progress
    expect(getProgramPaymentsPvResult.inProgress).toBe(false);
    expect(getProgramPaymentsOcwResult.inProgress).toBe(false);

    // Should not be possible to do a payment if there is a payment in progress for the program
    expect(doPaymentPvResultPaymentNext.status).toBe(202);
    expect(doPaymentOcwResultPaymentNext.status).toBe(202);
  });

  it('payment should be in progress for program during payment', async () => {
    const accessToken = await getAccessToken();
    // Arrange
    const paymentNr = 1;

    // We do a payment here but we do not wait for all transactions to complete
    await doPayment(PvProgramId, paymentNr, 25, [], accessToken, {
      'filter.status': '$in:included',
    });

    // Act
    const getProgramPaymentsPvResult = (
      await getProgramPaymentsStatus(programIdPV, accessToken)
    ).body;
    const getProgramPaymentsOcwResult = (
      await getProgramPaymentsStatus(programIdOCW, accessToken)
    ).body;
    const doPaymentPvResultCurrent = await doPayment(
      PvProgramId,
      paymentNr,
      25,
      [],
      accessToken,
      {
        'filter.status': '$in:included',
      },
    );
    const doPaymentPvResultPaymentNext = await doPayment(
      PvProgramId,
      paymentNr + 1,
      25,
      [],
      accessToken,
      {
        'filter.status': '$in:included',
      },
    );
    const doPaymentOcwResultPaymentNext = await doPayment(
      OcwProgramId,
      paymentNr,
      25,
      [],
      accessToken,
      {
        'filter.status': '$in:included',
      },
    );
    const retryPaymentPvResult = await retryPayment(
      PvProgramId,
      paymentNr,
      accessToken,
    );

    // Assert

    // PV should be in progress, OCW should not be in progress
    expect(getProgramPaymentsPvResult.inProgress).toBe(true);
    expect(getProgramPaymentsOcwResult.inProgress).toBe(false);

    // Should not be possible to do a payment if there is a payment in progress for the program
    expect(doPaymentPvResultCurrent.status).toBe(400);
    expect(doPaymentPvResultPaymentNext.status).toBe(400);
    expect(doPaymentOcwResultPaymentNext.status).toBe(202);
    expect(retryPaymentPvResult.status).toBe(400);
  });
});
