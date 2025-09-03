import { HttpStatus } from '@nestjs/common';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { registrationsPV } from '@121-service/test/fixtures/scoped-registrations';
import {
  doPayment,
  getProjectPaymentsStatus,
  retryPayment,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/project.helper';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  projectIdOCW,
  projectIdPV,
  registrationOCW4,
  registrationsOCW,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Payment in progress', () => {
  let accessToken: string;
  const registrationReferenceIdsPV = registrationsPV.map((r) => r.referenceId);
  const registrationReferenceIdsOCW = registrationsOCW.map(
    (r) => r.referenceId,
  );

  const registrationsVisaOcw = registrationsOCW.filter(
    (r) => r.projectFspConfigurationName === Fsps.intersolveVisa,
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
    await resetDB(SeedScript.nlrcMultiple, __filename);

    accessToken = await getAccessToken();
  });

  it('should not be in progress after payment is completed', async () => {
    // Arrange
    const paymentAmount = 25;
    const filterAllIncluded = { 'filter.status': '$in:included' };

    await seedIncludedRegistrations(registrationsPV, projectIdPV, accessToken);
    await seedIncludedRegistrations(
      registrationsOCW,
      projectIdOCW,
      accessToken,
    );

    // We do a payment here and wait for it to complete
    const doPaymentResponse = await doPayment({
      projectId: projectIdPV,
      amount: paymentAmount,
      referenceIds: [],
      accessToken,
      filter: filterAllIncluded,
    });
    const paymentIdPvFirst = doPaymentResponse.body.id;
    await waitForPaymentTransactionsToComplete({
      projectId: projectIdPV,
      paymentReferenceIds: registrationReferenceIdsPV,
      accessToken,
      maxWaitTimeMs: 10_000,
      paymentId: paymentIdPvFirst,
    });

    // Act
    const getProjectPaymentsPvResult = (
      await getProjectPaymentsStatus(projectIdPV, accessToken)
    ).body;
    const getProjectPaymentsOcwResult = (
      await getProjectPaymentsStatus(projectIdOCW, accessToken)
    ).body;

    const doPaymentPvResultPaymentNext = await doPayment({
      projectId: projectIdPV,
      amount: paymentAmount,
      referenceIds: [],
      accessToken,
      filter: filterAllIncluded,
    });
    const paymentIdPvNext = doPaymentPvResultPaymentNext.body.id;

    const doPaymentOcwResultPaymentNext = await doPayment({
      projectId: projectIdOCW,
      amount: paymentAmount,
      referenceIds: [],
      accessToken,
      filter: filterAllIncluded,
    });

    const paymentIdOcw = doPaymentOcwResultPaymentNext.body.id;

    // Assert
    expect(getProjectPaymentsPvResult.inProgress).toBe(false);
    expect(getProjectPaymentsOcwResult.inProgress).toBe(false);

    expect(doPaymentPvResultPaymentNext.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentOcwResultPaymentNext.status).toBe(HttpStatus.ACCEPTED);

    // Cleanup to make sure nothing is in progress anymore
    await waitForPaymentTransactionsToComplete({
      projectId: projectIdPV,
      paymentReferenceIds: registrationReferenceIdsPV,
      accessToken,
      maxWaitTimeMs: 30_000,
      paymentId: paymentIdPvNext,
    });
    await waitForPaymentTransactionsToComplete({
      projectId: projectIdOCW,
      paymentReferenceIds: registrationReferenceIdsOCW,
      accessToken,
      maxWaitTimeMs: 30_000,
      paymentId: paymentIdOcw,
    });
  });

  it('should be in progress when not yet completed combined', async () => {
    // Arrange
    const paymentAmount = 25;
    const filterAllIncluded = { 'filter.status': '$in:included' };

    await seedIncludedRegistrations(registrationsPV, projectIdPV, accessToken);
    await seedIncludedRegistrations(
      registrationsOCW,
      projectIdOCW,
      accessToken,
    );

    // Act
    // We do a payment and we do not wait for all transactions to complete
    const doPaymentResponse = await doPayment({
      projectId: projectIdPV,
      amount: paymentAmount,
      referenceIds: [],
      accessToken,
      filter: filterAllIncluded,
    });
    const paymentIdPv = doPaymentResponse.body.id;

    const getProjectPaymentsPvResult = (
      await getProjectPaymentsStatus(projectIdPV, accessToken)
    ).body;
    const getProjectPaymentsOcwResult = (
      await getProjectPaymentsStatus(projectIdOCW, accessToken)
    ).body;

    const doPaymentPvResultPaymentNext = await doPayment({
      projectId: projectIdPV,
      amount: paymentAmount,
      referenceIds: [],
      accessToken,
      filter: filterAllIncluded,
    });
    const doPaymentOcwResultPaymentNext = await doPayment({
      projectId: projectIdOCW,
      amount: paymentAmount,
      referenceIds: [],
      accessToken,
      filter: filterAllIncluded,
    });

    const retryPaymentPvResult = await retryPayment({
      projectId: projectIdPV,
      paymentId: paymentIdPv,
      accessToken,
    });

    // Assert
    expect(getProjectPaymentsPvResult.inProgress).toBe(true);
    expect(getProjectPaymentsOcwResult.inProgress).toBe(false);

    expect(doPaymentPvResultPaymentNext.status).toBe(HttpStatus.BAD_REQUEST);
    expect(doPaymentOcwResultPaymentNext.status).toBe(HttpStatus.ACCEPTED);
    expect(retryPaymentPvResult.status).toBe(HttpStatus.BAD_REQUEST);

    // Cleanup to make sure nothing is in progress anymore
    await waitForPaymentTransactionsToComplete({
      projectId: projectIdPV,
      paymentReferenceIds: registrationReferenceIdsPV,
      accessToken,
      maxWaitTimeMs: 30_000,
      paymentId: paymentIdPv,
    });
    await waitForPaymentTransactionsToComplete({
      projectId: projectIdOCW,
      paymentReferenceIds: registrationReferenceIdsOCW,
      accessToken,
      maxWaitTimeMs: 30_000,
      paymentId: doPaymentOcwResultPaymentNext.body.id,
    });
  });

  it('should be in progress when not yet completed visa only', async () => {
    // Arrange
    const paymentAmount = 25;
    const filterAllIncluded = { 'filter.status': '$in:included' };

    await seedIncludedRegistrations(
      registrationsVisaPV,
      projectIdPV,
      accessToken,
    );
    await seedIncludedRegistrations(
      registrationsVisaOcw,
      projectIdOCW,
      accessToken,
    );

    // Act
    // We do a payment only for the PV project and we do not wait for all transactions to complete
    const doPaymentResponse = await doPayment({
      projectId: projectIdPV,
      amount: paymentAmount,
      referenceIds: [],
      accessToken,
      filter: filterAllIncluded,
    });
    const paymentIdPv = doPaymentResponse.body.id;

    // PV project should be in progress, OCW should not
    const getProjectPaymentsPvResult = (
      await getProjectPaymentsStatus(projectIdPV, accessToken)
    ).body;
    const getProjectPaymentsOcwResult = (
      await getProjectPaymentsStatus(projectIdOCW, accessToken)
    ).body;

    // We expect that doing the next payment fails since the previous payment is still in progress
    const doPaymentPvResultPaymentNext = await doPayment({
      projectId: projectIdPV,
      amount: paymentAmount,
      referenceIds: [],
      accessToken,
      filter: filterAllIncluded,
    });
    // We expect that retrying the payment fails since the previous payment is still in progress
    const retryPaymentPvResult = await retryPayment({
      projectId: projectIdPV,
      paymentId: paymentIdPv,
      accessToken,
    });

    // We expect that doing a payment for OCW succeeds since the previous payment is not in progress (the payment in progress is for PV)
    const doPaymentOcwResultPaymentNext = await doPayment({
      projectId: projectIdOCW,
      amount: paymentAmount,
      referenceIds: [],
      accessToken,
      filter: filterAllIncluded,
    });

    // Assert
    // PV project should be in progress and new payments cannot be started
    expect(getProjectPaymentsPvResult.inProgress).toBe(true);
    expect(doPaymentPvResultPaymentNext.status).toBe(HttpStatus.BAD_REQUEST);
    expect(retryPaymentPvResult.status).toBe(HttpStatus.BAD_REQUEST);

    // OCW project should not be in progress and new payments can be started
    expect(getProjectPaymentsOcwResult.inProgress).toBe(false);
    expect(doPaymentOcwResultPaymentNext.status).toBe(HttpStatus.ACCEPTED);

    // Cleanup to make sure nothing is in progress anymore
    await waitForPaymentTransactionsToComplete({
      projectId: projectIdPV,
      paymentReferenceIds: registrationsVisaPV.map((r) => r.referenceId),
      accessToken,
      maxWaitTimeMs: 30_000,
      paymentId: paymentIdPv,
    });
    await waitForPaymentTransactionsToComplete({
      projectId: projectIdOCW,
      paymentReferenceIds: registrationsVisaOcw.map((r) => r.referenceId),
      accessToken,
      maxWaitTimeMs: 30_000,
      paymentId: doPaymentOcwResultPaymentNext.body.id,
    });
  });
});
