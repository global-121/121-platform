import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
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
  registrationOCW4,
  registrationsOCW,
} from '@121-service/test/registrations/pagination/pagination-data';
import { HttpStatus } from '@nestjs/common';

describe('Payment in progress', () => {
  let accessToken: string;
  const registrationReferenceIdsPV = registrationsPV.map((r) => r.referenceId);
  const registrationReferenceIdsOCW = registrationsOCW.map(
    (r) => r.referenceId,
  );

  const registrationsVisaOcw = registrationsOCW.filter(
    (r) => r.fspName === FinancialServiceProviderName.intersolveVisa,
  );
  // Create a registration with a different referenceId from OCW registrations as the default ones from PV have no VISA
  const registrationsVisaPV = [
    { ...registrationOCW4, referenceId: '13e62864557597e5d' },
    { ...registrationOCW4, referenceId: '13e62864557597e4d' },
    { ...registrationOCW4, referenceId: '13e62864557597e3d' },
    { ...registrationOCW4, referenceId: '13e62864557597e2d' },
    { ...registrationOCW4, referenceId: '13e62864557597e1d' },
    { ...registrationOCW4, referenceId: '13e62864557597e0d' },
  ];

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);

    accessToken = await getAccessToken();
  });

  it('should not be in progress after payment is completed', async () => {
    // Arrange
    const paymentAmount = 25;
    const filterAllIncluded = { 'filter.status': '$in:included' };

    await seedIncludedRegistrations(registrationsPV, programIdPV, accessToken);
    await seedIncludedRegistrations(
      registrationsOCW,
      programIdOCW,
      accessToken,
    );

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

  it('should be in progress when not yet completed combined', async () => {
    // Arrange
    const paymentAmount = 25;
    const filterAllIncluded = { 'filter.status': '$in:included' };

    await seedIncludedRegistrations(registrationsPV, programIdPV, accessToken);
    await seedIncludedRegistrations(
      registrationsOCW,
      programIdOCW,
      accessToken,
    );

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

  it('should be in progress when not yet completed visa only', async () => {
    // Arrange
    const paymentAmount = 25;
    const filterAllIncluded = { 'filter.status': '$in:included' };

    await seedIncludedRegistrations(
      registrationsVisaPV,
      programIdPV,
      accessToken,
    );
    await seedIncludedRegistrations(
      registrationsVisaOcw,
      programIdOCW,
      accessToken,
    );

    // Act
    // We do a payment only for the PV program and we do not wait for all transactions to complete
    await doPayment(
      programIdPV,
      1,
      paymentAmount,
      [],
      accessToken,
      filterAllIncluded,
    );

    // PV program should be in progress, OCW should not
    const getProgramPaymentsPvResult = (
      await getProgramPaymentsStatus(programIdPV, accessToken)
    ).body;
    const getProgramPaymentsOcwResult = (
      await getProgramPaymentsStatus(programIdOCW, accessToken)
    ).body;

    // We expect that doing the same payment again fails since it is already in progress
    const doPaymentPvResultCurrent = await doPayment(
      programIdPV,
      1,
      paymentAmount,
      [],
      accessToken,
      filterAllIncluded,
    );

    // We expect that doing the next payment fails since the previous payment is still in progress
    const doPaymentPvResultPaymentNext = await doPayment(
      programIdPV,
      2,
      paymentAmount,
      [],
      accessToken,
      filterAllIncluded,
    );
    // We expect that retrying the payment fails since the previous payment is still in progress
    const retryPaymentPvResult = await retryPayment(
      programIdPV,
      1,
      accessToken,
    );

    // We expect that doing the next payment for OCW succeeds since the previous payment is not in progress (the payment in progress is for PV)
    const doPaymentOcwResultPaymentNext = await doPayment(
      programIdOCW,
      1,
      paymentAmount,
      [],
      accessToken,
      filterAllIncluded,
    );

    // Assert
    // PV program should be in progress and new payments cannot be started
    expect(getProgramPaymentsPvResult.inProgress).toBe(true);
    expect(doPaymentPvResultCurrent.status).toBe(HttpStatus.BAD_REQUEST);
    expect(doPaymentPvResultPaymentNext.status).toBe(HttpStatus.BAD_REQUEST);
    expect(retryPaymentPvResult.status).toBe(HttpStatus.BAD_REQUEST);

    // OCW program should not be in progress and new payments can be started
    expect(getProgramPaymentsOcwResult.inProgress).toBe(false);
    expect(doPaymentOcwResultPaymentNext.status).toBe(HttpStatus.ACCEPTED);

    // Cleanup to make sure nothing is in progress anymore
    await waitForPaymentTransactionsToComplete(
      programIdPV,
      registrationsVisaPV.map((r) => r.referenceId),
      accessToken,
      30_000,
    );
    await waitForPaymentTransactionsToComplete(
      programIdOCW,
      registrationsVisaOcw.map((r) => r.referenceId),
      accessToken,
      30_000,
    );
  });
});
