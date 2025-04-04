import { HttpStatus } from '@nestjs/common';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  doPayment,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  awaitChangeRegistrationStatus,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  getServer,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationSafaricom } from '@121-service/test/registrations/pagination/pagination-data';

describe('Metric export list', () => {
  const programId = 1;
  const paymentNr = 1;
  const amount = 6537;
  let accessToken: string;

  beforeAll(async () => {
    await resetDB(SeedScript.safaricomProgram);

    accessToken = await getAccessToken();
    await importRegistrations(programId, [registrationSafaricom], accessToken);
    await awaitChangeRegistrationStatus({
      programId,
      referenceIds: [registrationSafaricom.referenceId],
      status: RegistrationStatusEnum.included,
      accessToken,
    });
  });

  it('should export payment report including FSP-specific fields for Safaricom', async () => {
    // Arrange
    const fspSpecificFields = ['mpesaTransactionId'];

    await doPayment({
      programId,
      paymentNr,
      amount,
      referenceIds: [],
      accessToken,
    });
    await waitForPaymentTransactionsToComplete({
      programId,
      paymentReferenceIds: [registrationSafaricom.referenceId],
      accessToken,
      maxWaitTimeMs: 10000,
      completeStatusses: [TransactionStatusEnum.success],
    });

    // Act
    const getPaymentReportResponse = await getServer()
      .get(
        `/programs/${programId}/metrics/export-list/payment?maxPayment=${paymentNr}&minPayment=${paymentNr}`,
      )
      .set('Cookie', [accessToken])
      .send();

    // Assert
    const data = getPaymentReportResponse.body.data;
    expect(getPaymentReportResponse.status).toBe(HttpStatus.OK);
    expect(data.length).toBe(1);
    for (const field of fspSpecificFields) {
      expect(data[0][field]).toBeTruthy();
    }
  });
});
