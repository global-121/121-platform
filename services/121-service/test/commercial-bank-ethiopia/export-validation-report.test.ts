import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  getCbeValidationReport,
  startCbeValidationProcess,
} from '@121-service/test/helpers/program.helper';
import { importRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationCbe } from '@121-service/test/registrations/pagination/pagination-data';

describe('Export CBE validation report', () => {
  const programId = 1;
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.cbeProgram, __filename);
    accessToken = await getAccessToken();
    await waitFor(1_000);
  });

  it('should successfully generate a report of CBE validation data', async () => {
    // // Arrange
    await importRegistrations(programId, [registrationCbe], accessToken);
    await startCbeValidationProcess(programId, accessToken);

    // Act
    const exportResult = await getCbeValidationReport(programId, accessToken);

    // Assert
    expect(exportResult.body.fileName).toBe('cbe-validation-report');
    // Validate the updated date
    const updated = new Date(exportResult.body.data[0].updated);
    expect(updated.toString()).not.toBe('Invalid Date');

    // We remove updated, because always changes
    const { updated: _updated, ...result } = exportResult.body.data[0];
    expect(result).toMatchSnapshot();
  });
});
