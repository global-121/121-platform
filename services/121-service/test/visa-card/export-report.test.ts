import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import {
  programIdVisa,
  registrationVisa,
} from '@121-service/src/seed-data/mock/visa-card.data';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import { exportList } from '@121-service/test/helpers/program.helper';
import {
  issueNewVisaCard,
  retrieveAndUpdateVisaWalletsAndDetails,
  seedPaidRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Export Visa debit card report', () => {
  const programId = 3;

  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
    await waitFor(2_000);
  });

  it('should succesfully generate a report of all Visa Debit cards', async () => {
    // Arrange
    await seedPaidRegistrations([registrationVisa], programIdVisa);

    // To ensure that the export also works if there are multiple cards for one person
    await issueNewVisaCard(
      programId,
      registrationVisa.referenceId,
      accessToken,
    );

    // This to ensure our mock is triggered
    await retrieveAndUpdateVisaWalletsAndDetails(
      programId,
      registrationVisa.referenceId,
      accessToken,
    );

    const exportResult = await exportList(
      programId,
      'intersolve-visa-card-details',
      accessToken,
    );

    // Assert
    expect(exportResult.body.fileName).toBe('intersolve-visa-card-details');
    // we remove issuedDate and cardNumber, because always changes
    const results = exportResult.body.data.map(
      ({ issuedDate: _issuedDate, cardNumber: _cardNumber, ...rest }) => rest,
    );
    expect(results).toMatchSnapshot();
  });
});
