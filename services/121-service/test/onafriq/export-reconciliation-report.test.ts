import { HttpStatus } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { Fsps } from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { OnafriqReconciliationReport } from '@121-service/src/payments/reconciliation/onafriq-reconciliation/interfaces/onafriq-reconciliation-report.interface';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  getServer,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Export reconciliation report', () => {
  const programId = 1;
  const transferValue = 12327;
  const baseRegistrationOnafriq = {
    referenceId: '01dc9451-1273-484c-b2e8-ae21b51a96ab',
    programFspConfigurationName: Fsps.onafriq,
    phoneNumber: '24311111111',
    phoneNumberPayment: '24322222222',
    preferredLanguage: RegistrationPreferredLanguage.en,
    paymentAmountMultiplier: 1,
    maxPayments: 6,
    firstName: 'Barbara',
    lastName: 'Floyd',
    gender: 'male',
    age: 25,
  };
  let registrationOnafriq;
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.onafriqProgram, __filename);
    accessToken = await getAccessToken();
    registrationOnafriq = { ...baseRegistrationOnafriq };
  });

  it('should successfully generate reconciliation report', async () => {
    // Arrange
    await seedPaidRegistrations({
      registrations: [registrationOnafriq],
      programId,
      transferValue,
      completeStatuses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
      ],
    });

    // Act
    const response = await getServer()
      .post(`/fsps/onafriq/reconciliation-report/${programId}`)
      .set('Cookie', [accessToken])
      .query({ toDate: new Date() }) // Use toDate to generate report with transactions from today
      .send();

    // Assert
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.length).toBe(1);

    // Check that transaction data contains expected values
    const firstDataRow: OnafriqReconciliationReport = response.body[0];
    expect(firstDataRow).toMatchObject({
      Transaction_Type: 'Transfer',
      Transaction_Status: expect.stringMatching(/success|error/),
      To_MSISDN: baseRegistrationOnafriq.phoneNumberPayment,
      Receive_amount: transferValue,
      Receive_Currency: env.ONAFRIQ_CURRENCY_CODE,
      From_MSISDN: env.ONAFRIQ_SENDER_MSISDN,
      Wallet_Identifier: expect.any(String),
      Partner_name: expect.any(String),
      Datestamp: expect.any(String),
      'Transaction ID': expect.any(String),
      'Onafriq Transaction ID': expect.any(String),
      Third_PartyID: expect.any(String),
      Send_Currency: null,
      Send_amount: null,
      Fee_Amount: null,
      Balance_before: null,
      Balance_after: null,
      Related_Transaction_ID: null,
    });
  });
});
