import { HttpStatus } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { OnafriqReconciliationReport } from '@121-service/src/payments/reconciliation/onafriq-reconciliation/interfaces/onafriq-reconciliation-report.interface';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  getServer,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Export reconciliation report', () => {
  const programId = 1;
  const payment = 1;
  const amount = 12327;
  const baseRegistrationOnafriq = {
    referenceId: '01dc9451-1273-484c-b2e8-ae21b51a96ab',
    programFspConfigurationName: Fsps.onafriq,
    phoneNumber: '24311111111',
    preferredLanguage: LanguageEnum.en,
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
    await seedPaidRegistrations(
      [registrationOnafriq],
      programId,
      payment,
      amount,
      [TransactionStatusEnum.success, TransactionStatusEnum.error],
    );

    // Act
    const response = await getServer()
      .post(`/fsps/onafriq/reconciliation-report`)
      .set('Cookie', [accessToken])
      .query({ isTest: true }) // Use isTest to generate report with transactions from today
      .send();

    // Assert
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.length).toBeGreaterThan(0); // Ensure we have some report items

    // Check that transaction data contains expected values
    const firstDataRow: OnafriqReconciliationReport = response.body[0];
    expect(firstDataRow.Transaction_Type).toBe('Transfer');
    expect(['success', 'error']).toContain(firstDataRow.Transaction_Status);
    expect(firstDataRow.To_MSISDN).toBe('24311111111');
    expect(firstDataRow.Receive_amount).toBe(amount);
    expect(firstDataRow.Receive_Currency).toBe(env.ONAFRIQ_CURRENCY_CODE);
    expect(firstDataRow.From_MSISDN).toBe(env.ONAFRIQ_SENDER_MSISDN);
    expect(firstDataRow.Wallet_Identifier).toBe(env.ONAFRIQ_CORPORATE_CODE);
    expect(firstDataRow.Partner_name).toBe(env.ONAFRIQ_CORPORATE_CODE);
    expect(typeof firstDataRow.Datestamp).toBe('string');
    expect(typeof firstDataRow['Transaction ID']).toBe('string');
    expect(typeof firstDataRow['Onafriq Transaction ID']).toBe('string');
    expect(typeof firstDataRow.Third_PartyID).toBe('string');
    expect(firstDataRow.Send_Currency).toBeNull();
    expect(firstDataRow.Send_amount).toBeNull();
    expect(firstDataRow.Fee_Amount).toBeNull();
    expect(firstDataRow.Balance_before).toBeNull();
    expect(firstDataRow.Balance_after).toBeNull();
    expect(firstDataRow.Related_Transaction_ID).toBeNull();
  });
});
