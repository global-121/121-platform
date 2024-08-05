import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  doPayment,
  exportList,
} from '@121-service/test/helpers/program.helper';
import {
  awaitChangePaStatus,
  getVisaWalletsAndDetails,
  importRegistrations,
  issueNewVisaCard,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Export Visa debit card report', () => {
  const programId = 3;
  const payment = 1;
  const amount = 25;

  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
    await waitFor(2_000);
  });

  it('should succesfully generate a report of all Visa Debit cards', async () => {
    // Arrange
    await importRegistrations(programId, [registrationVisa], accessToken);
    await awaitChangePaStatus(
      programId,
      [registrationVisa.referenceId],
      RegistrationStatusEnum.included,
      accessToken,
    );
    const paymentReferenceIds = [registrationVisa.referenceId];
    await doPayment(
      programId,
      payment,
      amount,
      paymentReferenceIds,
      accessToken,
    );

    // Act
    await waitFor(2_000);

    // To ensure that the export also works if there are multiple cards for one person
    await issueNewVisaCard(
      programId,
      registrationVisa.referenceId,
      accessToken,
    );

    await getVisaWalletsAndDetails(
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
