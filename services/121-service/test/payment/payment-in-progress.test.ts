import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { registrationsPV } from '@121-service/test/fixtures/scoped-registrations';
import {
  doPayment,
  getProgramPaymentsStatus,
  retryPayment,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  programIdPV,
  registrationsOCW,
} from '@121-service/test/registrations/pagination/pagination-data';
import { HttpStatus } from '@nestjs/common';

describe('Payment in progress', () => {
  let accessToken: string;
  const registrationReferenceIdsPV = registrationsPV.map((r) => r.referenceId);
  const registrationReferenceIdsOCW = registrationsOCW.map(
    (r) => r.referenceId,
  );

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);

    accessToken = await getAccessToken();

    await seedIncludedRegistrations(registrationsPV, programIdPV, accessToken);
    await seedIncludedRegistrations(
      registrationsOCW,
      programIdOCW,
      accessToken,
    );
  });

  it('should not be in progress after payment is completed', async () => {
    // Arrange
    const paymentAmount = 25;
    const filterAllIncluded = { 'filter.status': '$in:included' };

    // We do a payment here and wait for it to complete
    await doPayment(
      programIdPV,
      1,
      paymentAmount,
      [],
      accessToken,
      filterAllIncluded,
    );
    await waitForPaymentTransactionsToComplete(
      programIdPV,
      registrationReferenceIdsPV,
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
      2,
      paymentAmount,
      [],
      accessToken,
      filterAllIncluded,
    );

    const doPaymentOcwResultPaymentNext = await doPayment(
      programIdOCW,
      1,
      paymentAmount,
      [],
      accessToken,
      filterAllIncluded,
    );

    // Assert
    expect(getProgramPaymentsPvResult.inProgress).toBe(false);
    expect(getProgramPaymentsOcwResult.inProgress).toBe(false);

    expect(doPaymentPvResultPaymentNext.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentOcwResultPaymentNext.status).toBe(HttpStatus.ACCEPTED);

    // Cleanup to make sure nothing is in progress anymore
    await waitForPaymentTransactionsToComplete(
      programIdPV,
      registrationReferenceIdsPV,
      accessToken,
      30_000,
    );
    await waitForPaymentTransactionsToComplete(
      programIdOCW,
      registrationReferenceIdsOCW,
      accessToken,
      30_000,
    );
  });

  it('should be in progress when not yet completed', async () => {
    // Arrange
    const paymentAmount = 25;
    const filterAllIncluded = { 'filter.status': '$in:included' };

    // Act
    // We do a payment and we do not wait for all transactions to complete
    await doPayment(
      programIdPV,
      1,
      paymentAmount,
      [],
      accessToken,
      filterAllIncluded,
    );

    const getProgramPaymentsPvResult = (
      await getProgramPaymentsStatus(programIdPV, accessToken)
    ).body;
    const getProgramPaymentsOcwResult = (
      await getProgramPaymentsStatus(programIdOCW, accessToken)
    ).body;

    const doPaymentPvResultCurrent = await doPayment(
      programIdPV,
      1,
      paymentAmount,
      [],
      accessToken,
      filterAllIncluded,
    );

    const doPaymentPvResultPaymentNext = await doPayment(
      programIdPV,
      2,
      paymentAmount,
      [],
      accessToken,
      filterAllIncluded,
    );
    const doPaymentOcwResultPaymentNext = await doPayment(
      programIdOCW,
      1,
      paymentAmount,
      [],
      accessToken,
      filterAllIncluded,
    );

    const retryPaymentPvResult = await retryPayment(
      programIdPV,
      1,
      accessToken,
    );

    // Assert
    expect(getProgramPaymentsPvResult.inProgress).toBe(true);
    expect(getProgramPaymentsOcwResult.inProgress).toBe(false);

    expect(doPaymentPvResultCurrent.status).toBe(HttpStatus.BAD_REQUEST);
    expect(doPaymentPvResultPaymentNext.status).toBe(HttpStatus.BAD_REQUEST);
    expect(doPaymentOcwResultPaymentNext.status).toBe(HttpStatus.ACCEPTED);
    expect(retryPaymentPvResult.status).toBe(HttpStatus.BAD_REQUEST);

    // Cleanup to make sure nothing is in progress anymore
    await waitForPaymentTransactionsToComplete(
      programIdPV,
      registrationReferenceIdsPV,
      accessToken,
      30_000,
    );
    await waitForPaymentTransactionsToComplete(
      programIdOCW,
      registrationReferenceIdsOCW,
      accessToken,
      30_000,
    );
  });
});
