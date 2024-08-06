import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import {
  amountVisa,
  paymentNrVisa,
  programIdVisa,
  registrationVisa as registrationVisaDefault,
} from '@121-service/src/seed-data/mock/visa-card.data';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  doPayment,
  getTransactions,
  retryPayment,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  awaitChangePaStatus,
  importRegistrations,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { HttpStatus } from '@nestjs/common';

describe('Do payment with FSP Visa Debit and than retry it', () => {
  // Set WhatsApp-number for ALL tests in this suite only
  const registrationVisa = {
    ...registrationVisaDefault,
    whatsappPhoneNumber: registrationVisaDefault.phoneNumber,
  };

  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
    await waitFor(2_000);
  });

  it('should successfully retry pay-out after create customer error', async () => {
    // Arrange
    registrationVisa.fullName = 'mock-fail-create-customer';
    await importRegistrations(programIdVisa, [registrationVisa], accessToken);
    await awaitChangePaStatus(
      programIdVisa,
      [registrationVisa.referenceId],
      RegistrationStatusEnum.included,
      accessToken,
    );
    const paymentReferenceIds = [registrationVisa.referenceId];

    // Act
    const doPaymentResponse = await doPayment(
      programIdVisa,
      paymentNrVisa,
      amountVisa,
      paymentReferenceIds,
      accessToken,
    );

    await waitForPaymentTransactionsToComplete(
      programIdVisa,
      paymentReferenceIds,
      accessToken,
      3001,
      Object.values(StatusEnum),
      paymentNrVisa,
    );

    // update PA
    await updateRegistration(
      programIdVisa,
      registrationVisa.referenceId,
      { fullName: 'succeed' },
      'automated test',
      accessToken,
    );

    // retry payment
    await retryPayment(programIdVisa, paymentNrVisa, accessToken);
    await waitFor(2_000);

    // Assert
    const transactionsResponse = await getTransactions(
      programIdVisa,
      paymentNrVisa,
      registrationVisa.referenceId,
      accessToken,
    );

    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(
      paymentReferenceIds.length,
    );
    expect(transactionsResponse.text).toContain(StatusEnum.success);
  });

  it('should not multiply again on retry', async () => {
    // Arrange
    registrationVisa.fullName = 'mock-fail-create-customer';
    registrationVisa.paymentAmountMultiplier = 3;
    await importRegistrations(programIdVisa, [registrationVisa], accessToken);
    await awaitChangePaStatus(
      programIdVisa,
      [registrationVisa.referenceId],
      RegistrationStatusEnum.included,
      accessToken,
    );
    const paymentReferenceIds = [registrationVisa.referenceId];

    // Act
    await doPayment(
      programIdVisa,
      paymentNrVisa,
      amountVisa,
      paymentReferenceIds,
      accessToken,
    );

    await waitForPaymentTransactionsToComplete(
      programIdVisa,
      paymentReferenceIds,
      accessToken,
      3001,
      Object.values(StatusEnum),
      paymentNrVisa,
    );

    // update PA
    await updateRegistration(
      programIdVisa,
      registrationVisa.referenceId,
      { fullName: 'succeed' },
      'automated test',
      accessToken,
    );

    // retry payment
    await retryPayment(programIdVisa, paymentNrVisa, accessToken);
    await waitFor(2_000);

    // Assert
    const transactionsResponse = await getTransactions(
      programIdVisa,
      paymentNrVisa,
      registrationVisa.referenceId,
      accessToken,
    );

    expect(transactionsResponse.body[0].amount).toBe(
      amountVisa * registrationVisa.paymentAmountMultiplier,
    );
    expect(transactionsResponse.text).toContain(StatusEnum.success);
  });
});
