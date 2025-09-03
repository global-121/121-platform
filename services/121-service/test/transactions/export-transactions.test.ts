import * as XLSX from 'xlsx';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  exportTransactions,
  patchProjectRegistrationAttribute,
} from '@121-service/test/helpers/project.helper';
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
  const projectId = 1;
  const amount = 15;

  beforeEach(async () => {
    await resetDB(SeedScript.safaricomProject, __filename);
    accessToken = await getAccessToken();
  });

  it('should export transaction with the correct fields', async () => {
    // Arrange

    // Ensure the 'age' attribute is not exported anymore
    await patchProjectRegistrationAttribute({
      projectId,
      projectRegistrationAttributeName: 'age',
      projectRegistrationAttribute: {
        includeInTransactionExport: false,
      },
      accessToken,
    });

    const fromDate = new Date().toISOString();
    const paymentId = await seedPaidRegistrations(
      [registrationSafaricom],
      projectId,
      amount,
    );
    const toDate = new Date().toISOString();

    // Act
    const transactionsResponse = await exportTransactions({
      projectId,
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
      paymentId,
      paymentDate: expect.any(Number),
      paymentCount: 1,
      gender: expect.any(String),
      // Transaction GET fields
      id: expect.any(Number),
      amount: expect.any(Number),
      status: TransactionStatusEnum.success,
      registrationId: expect.any(Number),
      registrationProjectId: expect.any(Number),
      registrationReferenceId: referenceId,
      registrationName: registrationSafaricom.fullName,
      registrationStatus: expect.any(String),
      // Safaricom specific fields
      mpesaTransactionId: expect.any(String),
    });
  });

  it('should filter transactions based on date range', async () => {
    // Arrange

    // Payment that should not be exported
    await seedPaidRegistrations([registrationSafaricom], projectId, amount);

    const fromDate = new Date().toISOString();

    // Paymentthat should be exported
    const paymentIdOfMiddlePayment = await doPaymentAndWaitForCompletion({
      projectId,
      referenceIds: [registrationSafaricom.referenceId],
      amount,
      accessToken,
    });
    const toDate = new Date().toISOString();

    // Payment that should not be exported
    await doPaymentAndWaitForCompletion({
      projectId,
      referenceIds: [registrationSafaricom.referenceId],
      amount,
      accessToken,
    });

    // Act
    const transactionsResponse = await exportTransactions({
      projectId,
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
      paymentId: paymentIdOfMiddlePayment,
      paymentCount: 3,
    });
  });

  it('should filter transactions based payment', async () => {
    // Arrange

    // Payment 1
    await seedPaidRegistrations([registrationSafaricom], projectId, amount);

    // Payment 2
    const paymentIdOfSecondPayment = await doPaymentAndWaitForCompletion({
      projectId,
      referenceIds: [registrationSafaricom.referenceId],
      amount,
      accessToken,
    });

    // Act: Export only payment 2
    const transactionsResponse = await exportTransactions({
      projectId,
      paymentId: paymentIdOfSecondPayment,
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
    const transactionFromSecondPayment = transactionsJson[0];
    expect(transactionFromSecondPayment).toMatchObject({
      paymentId: paymentIdOfSecondPayment,
      paymentCount: 2,
    });
  });
});
