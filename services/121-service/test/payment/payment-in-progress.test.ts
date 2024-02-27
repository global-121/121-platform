import { HttpStatus } from '@nestjs/common';
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

describe('Payment in progress', () => {
  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    await seedIncludedRegistrations(registrationsOCW, programIdOCW);
    await seedIncludedRegistrations(registrationsPV, programIdPV);
  });

  it('should not be in progress after payment', async () => {
    // Arrange
    const accessToken = await getAccessToken();
    const paymentNr = 1;
    const paymentAmount = 25;
    const filterAllIncluded = { 'filter.status': '$in:included' };

    // We do a payment here and wait for it to complete
    await doPayment(
      programIdPV,
      paymentNr,
      paymentAmount,
      [],
      accessToken,
      filterAllIncluded,
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
      programIdPV,
      paymentNr + 1,
      paymentAmount,
      [],
      accessToken,
      filterAllIncluded,
    );
    const doPaymentOcwResultPaymentNext = await doPayment(
      programIdOCW,
      paymentNr,
      paymentAmount,
      [],
      accessToken,
      filterAllIncluded,
    );

    // Assert
    // Nothing should be in progress
    expect(getProgramPaymentsPvResult.inProgress).toBe(false);
    expect(getProgramPaymentsOcwResult.inProgress).toBe(false);

    // Should not be possible to do a payment if there is a payment in progress for the program
    expect(doPaymentPvResultPaymentNext.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentOcwResultPaymentNext.status).toBe(HttpStatus.ACCEPTED);
  });

  it('should be in progress for program during payment', async () => {
    // Arrange
    const accessToken = await getAccessToken();
    const paymentNr = 1;
    const paymentAmount = 25;
    const filterAllIncluded = { 'filter.status': '$in:included' };

    // We do a payment here but we do not wait for all transactions to complete
    await doPayment(
      programIdPV,
      paymentNr,
      paymentAmount,
      [],
      accessToken,
      filterAllIncluded,
    );

    // Act
    const getProgramPaymentsPvResult = (
      await getProgramPaymentsStatus(programIdPV, accessToken)
    ).body;
    const getProgramPaymentsOcwResult = (
      await getProgramPaymentsStatus(programIdOCW, accessToken)
    ).body;
    const doPaymentPvResultCurrent = await doPayment(
      programIdPV,
      paymentNr,
      paymentAmount,
      [],
      accessToken,
      filterAllIncluded,
    );

    const doPaymentPvResultPaymentNext = await doPayment(
      programIdPV,
      paymentNr + 1,
      paymentAmount,
      [],
      accessToken,
      filterAllIncluded,
    );
    const doPaymentOcwResultPaymentNext = await doPayment(
      programIdOCW,
      paymentNr,
      paymentAmount,
      [],
      accessToken,
      filterAllIncluded,
    );
    const retryPaymentPvResult = await retryPayment(
      programIdPV,
      paymentNr,
      accessToken,
    );

    // Assert
    // PV should be in progress, OCW should not be in progress
    expect(getProgramPaymentsPvResult.inProgress).toBe(true);
    expect(getProgramPaymentsOcwResult.inProgress).toBe(false);

    // Should not be possible to do a payment if there is a payment in progress for the program
    expect(doPaymentPvResultCurrent.status).toBe(HttpStatus.BAD_REQUEST);
    expect(doPaymentPvResultPaymentNext.status).toBe(HttpStatus.BAD_REQUEST);
    expect(doPaymentOcwResultPaymentNext.status).toBe(HttpStatus.ACCEPTED);
    expect(retryPaymentPvResult.status).toBe(HttpStatus.BAD_REQUEST);
  });
});
