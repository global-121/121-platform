import { HttpStatus } from '@nestjs/common';
import * as XLSX from 'xlsx';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  exportTransactionsAsBuffer,
  patchProgramRegistrationAttribute,
} from '@121-service/test/helpers/program.helper';
import {
  doPaymentAndWaitForCompletion,
  seedPaidRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  getServer,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationSafaricom } from '@121-service/test/registrations/pagination/pagination-data';

let accessToken: string;
describe('Export transactions', () => {
  const programId = 1;
  const transferValue = 15;

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
    const paymentId = await seedPaidRegistrations(
      [registrationSafaricom],
      programId,
      transferValue,
      [TransactionStatusEnum.success],
    );
    const toDate = new Date().toISOString();

    // Act
    const transactionsResponse = await exportTransactionsAsBuffer({
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
      paymentId,
      paymentDate: expect.any(Number),
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

    // Payment that should not be exported
    await seedPaidRegistrations(
      [registrationSafaricom],
      programId,
      transferValue,
    );

    const fromDate = new Date().toISOString();

    // Paymentthat should be exported
    const paymentIdOfMiddlePayment = await doPaymentAndWaitForCompletion({
      programId,
      referenceIds: [registrationSafaricom.referenceId],
      transferValue,
      accessToken,
    });
    const toDate = new Date().toISOString();

    // Payment that should not be exported
    await doPaymentAndWaitForCompletion({
      programId,
      referenceIds: [registrationSafaricom.referenceId],
      transferValue,
      accessToken,
    });

    // Act
    const transactionsResponse = await exportTransactionsAsBuffer({
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
      paymentId: paymentIdOfMiddlePayment,
      paymentCount: 3,
    });
  });

  it('should filter transactions based on payment', async () => {
    // Arrange

    // Payment 1
    await seedPaidRegistrations(
      [registrationSafaricom],
      programId,
      transferValue,
    );

    // Payment 2
    const paymentIdOfSecondPayment = await doPaymentAndWaitForCompletion({
      programId,
      referenceIds: [registrationSafaricom.referenceId],
      transferValue,
      accessToken,
    });

    // Act: Export only payment 2
    const transactionsResponse = await exportTransactionsAsBuffer({
      programId,
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

  it('should return 400 for invalid query parameters', async () => {
    // Arrange
    const invalidFields = {
      fromDate: 'not-a-date',
      toDate: 'not-a-date',
      paymentId: 'not-a-number' as unknown as number,
      format: 'invalid-format',
    };
    // Act

    const transactionsResponse = await getServer()
      .get(`/programs/${programId}/transactions`)
      .query({
        ...invalidFields,
      })
      .set('Cookie', [accessToken]);

    // Assert
    expect(transactionsResponse.statusCode).toBe(HttpStatus.BAD_REQUEST);

    // The test dynamically checks that all invalid fields are reported in the error message
    const errorResponse = transactionsResponse.body;
    const faultyPropertiesInMessage = errorResponse.message.map(
      (messageObj) => messageObj.property,
    );
    expect(Object.keys(invalidFields)).toEqual(
      expect.arrayContaining(faultyPropertiesInMessage),
    );
  });
});
