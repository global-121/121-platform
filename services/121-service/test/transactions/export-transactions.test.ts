import * as XLSX from 'xlsx';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { exportTransactionsByDateRange } from '@121-service/test/helpers/program.helper';
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

  beforeAll(async () => {
    await resetDB(SeedScript.safaricomProgram, __filename);
    accessToken = await getAccessToken();
  });

  it('should return transactions with all expected fields and correct data types', async () => {
    // Arrange

    // Payment that should not be exported
    await seedPaidRegistrations([registrationSafaricom], programId, 1, amount);

    const fromDate = new Date().toISOString();

    // Payment that should be exported
    await doPaymentAndWaitForCompletion({
      programId,
      referenceIds: [registrationSafaricom.referenceId],
      amount,
      accessToken,
      paymentNr: 2,
    });
    const toDate = new Date().toISOString();

    // Payment that should not be exported
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
    console.log('🚀 ~ it ~ tomorrow:', tomorrow);
    console.log('🚀 ~ it ~ yesterday:', yesterday);

    // Act
    const transactionsResponse = await exportTransactionsByDateRange({
      programId,
      fromDate,
      toDate,
      accessToken,
    });
    console.log(
      '🚀 ~ it ~ transactionsResponse:',
      JSON.stringify(transactionsResponse.body),
    );

    // Assert
    expect(transactionsResponse.statusCode).toBe(200);

    // Parse Excel buffer to JSON
    const workbook = XLSX.read(transactionsResponse.body, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    console.log('🚀 ~ it ~ worksheet:', worksheet);
    const transactionsJson = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log('🚀 ~ it ~ transactionsJson:', transactionsJson);
  });
});
