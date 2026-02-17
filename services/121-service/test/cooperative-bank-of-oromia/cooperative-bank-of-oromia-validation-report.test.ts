import { v4 as uuid } from 'uuid';

import { CooperativeBankOfOromiaAccountValidationReportRecordDto } from '@121-service/src/fsp-integrations/account-management/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-account-validation-report-record.dto';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getCooperativeBankOfOromiaValidationReport,
  startCooperativeBankOfOromiaValidationProcess,
} from '@121-service/test/helpers/program.helper';
import { importRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationCooperativeBankOfOromia } from '@121-service/test/registrations/pagination/pagination-data';

async function getValidationReportRecord({
  programId,
  registration,
  accessToken,
}: {
  programId: number;
  registration: typeof registrationCooperativeBankOfOromia;
  accessToken: string;
}): Promise<CooperativeBankOfOromiaAccountValidationReportRecordDto> {
  await importRegistrations(programId, [registration], accessToken);
  await startCooperativeBankOfOromiaValidationProcess(programId, accessToken);
  const exportResult = await getCooperativeBankOfOromiaValidationReport(
    programId,
    accessToken,
  );
  const exportBody = exportResult.body;
  return exportBody.data.find(
    (r) => r.referenceId === registration.referenceId,
  );
}

describe('Validate cooperative bank of oromia accounts', () => {
  const programId = 1;
  let accessToken: string;

  const matchingRegistration = {
    ...registrationCooperativeBankOfOromia,
    referenceId: uuid(),
  };

  beforeAll(async () => {
    await resetDB(SeedScript.cooperativeBankOfOromiaProgram, __filename);
    accessToken = await getAccessToken();
  });

  it('should generate a validation report with the expected file name', async () => {
    // Act
    const exportResult = await getCooperativeBankOfOromiaValidationReport(
      programId,
      accessToken,
    );
    const exportBody = exportResult.body;
    // Assert
    expect(exportBody.fileName).toBe(
      'cooperative-bank-of-oromia-account-validations-report',
    );
  });

  it('should report both names when registration and bank account names are available', async () => {
    const record = await getValidationReportRecord({
      programId,
      registration: matchingRegistration,
      accessToken,
    });
    expect(record).toMatchObject({
      nameUsedForTheMatch: matchingRegistration.fullName,
      cooperativeBankOfOromiaName: 'JANE DOE', // name that the mock API returns
      updated: expect.any(String),
      errorMessage: null,
      bankAccountNumberUsedForCall: matchingRegistration.bankAccountNumber,
    });
  });

  it('should report an error for a non-existent bank account number', async () => {
    const nonExistentAccountRegistration = {
      ...registrationCooperativeBankOfOromia,
      referenceId: uuid(),
      bankAccountNumber: '1234567893',
    };
    const record = await getValidationReportRecord({
      programId,
      registration: nonExistentAccountRegistration,
      accessToken,
    });
    expect(record).toMatchObject({
      nameUsedForTheMatch: nonExistentAccountRegistration.fullName,
      cooperativeBankOfOromiaName: null,
      updated: expect.any(String),
      bankAccountNumberUsedForCall:
        nonExistentAccountRegistration.bankAccountNumber,
    });
    expect(record.errorMessage).toMatchInlineSnapshot(
      `"Message: No records were found that matched the selection criteria"`,
    );
  });

  it('should report a generic error for an unexpected bank API failure', async () => {
    const unexpectedErrorRegistration = {
      ...registrationCooperativeBankOfOromia,
      referenceId: uuid(),
      bankAccountNumber: '1234567894',
    };
    const record = await getValidationReportRecord({
      programId,
      registration: unexpectedErrorRegistration,
      accessToken,
    });
    expect(record).toMatchObject({
      nameUsedForTheMatch: unexpectedErrorRegistration.fullName,
      cooperativeBankOfOromiaName: null,
      updated: expect.any(String),
      bankAccountNumberUsedForCall:
        unexpectedErrorRegistration.bankAccountNumber,
    });
    expect(record.errorMessage).toMatchInlineSnapshot(
      `"Cooperative Bank of Oromia did not provide error details for account validation. The service may be temporarily unavailable or returned an unexpected response format."`,
    );
  });
});
