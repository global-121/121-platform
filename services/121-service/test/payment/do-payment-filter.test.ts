import { HttpStatus } from '@nestjs/common';
import {
  amountVisa,
  paymentNrVisa,
  programIdVisa,
} from '../../seed-data/mock/visa-card.data';
import { RegistrationStatusEnum } from '../../src/registration/enum/registration-status.enum';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../src/shared/enum/program-phase.enum';
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
  programIdOCW,
  registrationOCW1,
  registrationOCW2,
  registrationOCW3,
  registrationOCW4,
} from '../registrations/pagination/pagination-data';

describe('Do payment with filter', () => {
  let accessToken: string;
  // Arrange
  const includedRefrenceIds = [
    registrationOCW1.referenceId,
    registrationOCW2.referenceId,
    registrationOCW3.referenceId,
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
      programIdOCW,
      [registrationOCW1, registrationOCW2, registrationOCW3, registrationOCW4],
      accessToken,
    );

    await awaitChangePaStatus(
      programIdVisa,
      includedRefrenceIds,
      RegistrationStatusEnum.included,
      accessToken,
    );
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
      10_000,
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
      10_000,
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
        'filter.referenceId': `$in:${registrationOCW1.referenceId}`,
      },
    );

    await waitForPaymentTransactionsToComplete(
      programIdVisa,
      [registrationOCW1.referenceId],
      accessToken,
      10_000,
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
      [registrationOCW2.referenceId],
      accessToken,
      10_000,
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
