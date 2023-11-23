import { HttpStatus } from '@nestjs/common';
import { RegistrationStatusEnum } from '../../src/registration/enum/registration-status.enum';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../src/shared/enum/program-phase.model';
import {
  changePhase,
  doPayment,
  getTransactions,
  waitForPaymentTransactionsToComplete,
} from '../helpers/program.helper';
import {
  awaitChangePaStatus,
  importRegistrations,
} from '../helpers/registration.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';
import {
  programId,
  registration1,
  registration2,
  registration3,
  registration4,
} from '../registrations/pagination/pagination-data';
import {
  amountVisa,
  paymentNrVisa,
  programIdVisa,
} from '../../seed-data/mock/visa-card.data';

describe('Do payment with filter', () => {
  let accessToken: string;
  // Arrange
  const includedRefrenceIds = [
    registration1.referenceId,
    registration2.referenceId,
    registration3.referenceId,
  ];

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    await changePhase(
      programIdVisa,
      ProgramPhase.registrationValidation,
      accessToken,
    );
    await changePhase(programIdVisa, ProgramPhase.inclusion, accessToken);
    await changePhase(programIdVisa, ProgramPhase.payment, accessToken);
    await importRegistrations(
      programId,
      [registration1, registration2, registration3, registration4],
      accessToken,
    );

    await awaitChangePaStatus(
      programIdVisa,
      includedRefrenceIds,
      RegistrationStatusEnum.included,
      accessToken,
    );
    // await waitFor(2_000);
  });

  it('should only pay included people', async () => {
    // Act
    const doPaymentResponse = await doPayment(
      programIdVisa,
      paymentNrVisa,
      amountVisa,
      [],
      accessToken,
    );

    await waitForPaymentTransactionsToComplete(
      programIdVisa,
      includedRefrenceIds,
      accessToken,
      8000,
    );
    const transactionsResponse = await getTransactions(
      programIdVisa,
      paymentNrVisa,
      null,
      accessToken,
    );
    // Assert
    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(
      includedRefrenceIds.length,
    );

    // Also check if the right amount of transactions are created
    expect(transactionsResponse.body.length).toBe(includedRefrenceIds.length);
  });

  // This test is the same as the one above, but with a query filter parameter
  // This is done because the query filter parameter is used in the frontend when you are on the payment page
  // So in practice this query filter will very often be used
  it('should only pay included people with query filter included', async () => {
    // Act
    const doPaymentResponse = await doPayment(
      programIdVisa,
      paymentNrVisa,
      amountVisa,
      [],
      accessToken,
      { 'filter.status': '$in:included' },
    );

    await waitForPaymentTransactionsToComplete(
      programIdVisa,
      includedRefrenceIds,
      accessToken,
      8000,
    );
    const transactionsResponse = await getTransactions(
      programIdVisa,
      paymentNrVisa,
      null,
      accessToken,
    );
    // Assert
    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(
      includedRefrenceIds.length,
    );
    // Also check if the right amount of transactions are created
    expect(transactionsResponse.body.length).toBe(includedRefrenceIds.length);
  });

  it('should only pay included people with query filter referenceId', async () => {
    // Act
    const doPaymentResponse = await doPayment(
      programIdVisa,
      paymentNrVisa,
      amountVisa,
      [],
      accessToken,
      {
        'filter.status': '$in:included',
        'filter.referenceId': `$in:${registration1.referenceId}`,
      },
    );

    await waitForPaymentTransactionsToComplete(
      programIdVisa,
      [registration1.referenceId],
      accessToken,
      8000,
    );
    const transactionsResponse = await getTransactions(
      programIdVisa,
      paymentNrVisa,
      null,
      accessToken,
    );
    // Assert
    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(1);
    // Also check if the right amount of transactions are created
    expect(transactionsResponse.body.length).toBe(1);
  });

  it('should only pay included people with a combi of filters', async () => {
    // Act
    const doPaymentResponse = await doPayment(
      programIdVisa,
      paymentNrVisa,
      amountVisa,
      [],
      accessToken,
      {
        // 'filter.status': '$ilike:included',
        'filter.whatsappPhoneNumber': `$ilike:1415523777`,
        // 'filter.paymentAmountMultiplier': `1`,
        // sort: `firstName`,
      },
    );

    await waitForPaymentTransactionsToComplete(
      programIdVisa,
      [registration2.referenceId],
      accessToken,
      8000,
    );
    const transactionsResponse = await getTransactions(
      programIdVisa,
      paymentNrVisa,
      null,
      accessToken,
    );
    // Assert
    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(1);
    // Also check if the right amount of transactions are created
    expect(transactionsResponse.body.length).toBe(1);
  });
});
