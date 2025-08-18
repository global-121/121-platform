import * as XLSX from 'xlsx';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  exportTransactions,
  patchProgramRegistrationAttribute,
} from '@121-service/test/helpers/program.helper';
import {
  doPaymentAndWaitForCompletion,
  seedPaidRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationSafaricom } from '@121-service/test/registrations/pagination/pagination-data';

let accessToken: string;
describe('Export transactions', () => {
  const programId = 1;
  const amount = 15;

  beforeEach(async () => {
    await resetDB(SeedScript.safaricomProgram, __filename);
    accessToken = await getAccessToken();
  });

  it('should export transaction with the correct fields', async () => {
    // Arrange

    // Ensure the 'age' attribute is not exported anymore
    await patchProgramRegistrationAttribute({
      programId,
      programRegistrationAttributeName: 'age',
      programRegistrationAttribute: {
        includeInTransactionExport: false,
      },
      accessToken,
    });

    const fromDate = new Date().toISOString();
    await seedPaidRegistrations([registrationSafaricom], programId, amount);
    const toDate = new Date().toISOString();

    // Act
    const transactionsResponse = await exportTransactions({
      programId,
      fromDate,
      toDate,
      accessToken,
    });

    const workbook = XLSX.read(transactionsResponse.body, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const transactionsJson =
      XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

    // Assert
    expect(transactionsResponse.statusCode).toBe(200);
    expect(transactionsJson.length).toBe(1);
    const transactionFromPayment1 = transactionsJson[0];
    const {
      age: _age,
      referenceId: referenceId,
      ...registrationSafaricomCleaned
    } = registrationSafaricom;
    expect(transactionFromPayment1.gender).toMatchSnapshot();
    expect(transactionFromPayment1).toEqual({
      ...registrationSafaricomCleaned,
      // Default registrationView fields
      created: expect.any(Number),
      updated: expect.any(Number),
      paymentId: 1,
      paymentCount: 1,
      gender: expect.any(String),
      // Transaction GET fields
      id: expect.any(Number),
      amount: expect.any(Number),
      status: TransactionStatusEnum.success,
      registrationId: expect.any(Number),
      registrationProgramId: expect.any(Number),
      registrationReferenceId: referenceId,
      registrationName: registrationSafaricom.fullName,
      registrationStatus: expect.any(String),
      // Safaricom specific fields
      mpesaTransactionId: expect.any(String),
    });
  });

  it('should filter transactions based on date range', async () => {
    // Arrange

    // Payment 1 that should not be exported
    await seedPaidRegistrations([registrationSafaricom], programId, amount);

    const fromDate = new Date().toISOString();

    // Payment 2 that should be exported
    await doPaymentAndWaitForCompletion({
      programId,
      referenceIds: [registrationSafaricom.referenceId],
      amount,
      accessToken,
      paymentNr: 2,
    });
    const toDate = new Date().toISOString();

    // Payment 3 that should not be exported
    await doPaymentAndWaitForCompletion({
      programId,
      referenceIds: [registrationSafaricom.referenceId],
      amount,
      accessToken,
      paymentNr: 3,
    });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    // Act
    const transactionsResponse = await exportTransactions({
      programId,
      fromDate,
      toDate,
      accessToken,
    });

    const workbook = XLSX.read(transactionsResponse.body, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const transactionsJson = XLSX.utils.sheet_to_json(worksheet);

    // Check the filename in the Content-Disposition header
    const contentDisposition =
      transactionsResponse.headers['content-disposition'];
    expect(contentDisposition).toContain('attachment; filename=');
    expect(contentDisposition).toMatch(/transactions_\d+_.+\.xlsx/);

    // Assert
    expect(transactionsResponse.statusCode).toBe(200);
    expect(transactionsJson.length).toBe(1);
    const transactionFromPayment2 = transactionsJson[0];
    expect(transactionFromPayment2).toMatchObject({
      paymentId: 2,
      paymentCount: 3,
    });
  });

  it('should filter transactions based payment', async () => {
    // Arrange

    // Payment 1
    await seedPaidRegistrations([registrationSafaricom], programId, amount);

    // Payment 2
    await doPaymentAndWaitForCompletion({
      programId,
      referenceIds: [registrationSafaricom.referenceId],
      amount,
      accessToken,
      paymentNr: 2,
    });

    // Act: Export only payment 2
    const transactionsResponse = await exportTransactions({
      programId,
      paymentId: 2,
      accessToken,
    });

    const workbook = XLSX.read(transactionsResponse.body, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const transactionsJson =
      XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

    // Assert
    expect(transactionsResponse.statusCode).toBe(200);
    expect(transactionsJson.length).toBe(1);
    const transactionFromPayment2 = transactionsJson[0];
    expect(transactionFromPayment2).toMatchObject({
      paymentId: 2,
      paymentCount: 2,
    });
  });
});
