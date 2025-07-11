import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
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
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
    expect(response.headers['content-disposition']).toMatch(
      /attachment; filename=.*\.csv/,
    );

    // Verify CSV structure and content
    const csvLines = response.text.split('\n');
    expect(csvLines.length).toBeGreaterThan(1); // Header + at least one data row

    // Check CSV header
    const expectedHeaders = [
      'Datestamp',
      'Transaction ID',
      'Onafriq Transaction ID',
      'Third_PartyID',
      'Transaction_Type',
      'Transaction_Status',
      'From_MSISDN',
      'To_MSISDN',
      'Send_Currency',
      'Receive_Currency',
      'Send_amount',
      'Receive_amount',
      'Fee_Amount',
      'Balance_before',
      'Balance_after',
      'Related_Transaction_ID',
      'Wallet_Identifier',
      'Partner_name',
    ];
    expect(csvLines[0]).toBe(expectedHeaders.join(','));

    // Check that we have data rows (filter out empty lines)
    const dataRows = csvLines.slice(1).filter((line) => line.trim().length > 0);
    expect(dataRows.length).toBeGreaterThan(0);

    // Verify each data row has the correct number of columns
    dataRows.forEach((row) => {
      const columns = row.split(',');
      expect(columns.length).toBe(expectedHeaders.length);
    });

    // Check that transaction data contains expected values
    const firstDataRow = dataRows[0].split(',');
    expect(firstDataRow[4]).toBe('Transfer'); // Transaction_Type
    expect(['success', 'error']).toContain(firstDataRow[5]); // Transaction_Status
    expect(firstDataRow[7]).toBe('24311111111'); // To_MSISDN (phone number)
    expect(parseFloat(firstDataRow[11])).toBe(amount); // Receive_amount
  });
});
