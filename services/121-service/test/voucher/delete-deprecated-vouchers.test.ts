import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  removeDeprecatedImageCodes,
  waitForMessagesToComplete,
} from '@121-service/test/helpers/program.helper';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Delete deprecated vouchers', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
  });

  it(`should not delete images that are not older than a day`, async () => {
    // Arrange
    await seedPaidRegistrations([registrationPV5], programIdPV);

    // Act
    const response = await removeDeprecatedImageCodes({ accessToken });
    await waitForMessagesToComplete({
      programId: programIdPV,
      referenceIds: [registrationPV5.referenceId],
      accessToken,
      minimumNumberOfMessages: 3,
    });
    // Assert
    // We expect that no image codes are deleted because all of them are still valid
    expect(response.text).toBe('0');
  });

  it(`should delete image that is older than a day`, async () => {
    // Arrange
    await seedPaidRegistrations([registrationPV5], programIdPV);

    // Act
    // pretend that it is 2 days later
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    await waitForMessagesToComplete({
      programId: programIdPV,
      referenceIds: [registrationPV5.referenceId],
      accessToken,
      minimumNumberOfMessages: 3,
    });
    const response = await removeDeprecatedImageCodes({
      accessToken,
      mockCurrentDateIsoString: dayAfterTomorrow.toISOString(),
    });

    // Assert
    // We expect that one image code is deleted because it is older than a day
    expect(response.text).toBe('1');
  });
});
