import { HttpStatus } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { GenericRegistrationAttributes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { getRegistrationEventsPaginated } from '@121-service/test/helpers/program.helper';
import {
  changeRegistrationStatus,
  duplicateRegistrationsAndPaymentData,
  importRegistrations,
  updateRegistration,
  waitForStatusChangeToComplete,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { programIdOCW } from '@121-service/test/registrations/pagination/pagination-data';

// eslint-disable-next-line n/no-process-env -- Only used in test-runs, not included in '@121-service/src/env'
const duplicateNumber = parseInt(process.env.DUPLICATE_NUMBER || '5'); // cronjob duplicate number should be 2^17 = 131072

const supportedNumberOfRecords = 400_000; // Adjust based on expected supported number. This is enough for 3 * 2^17 events
const maxWaitTimeMs = 240_000; // 4 minutes
const testTimeout = 5_400_000; // 90 minutes

jest.setTimeout(testTimeout);
describe('Get paginated registrations events', () => {
  let accessToken: string;

  it('Should get registration events for 100k registrations within acceptable time', async () => {
    /////////////
    // Arrange //
    /////////////
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();

    // Upload registration
    const importRegistrationResponse = await importRegistrations(
      programIdOCW,
      [registrationVisa],
      accessToken,
    );
    expect(importRegistrationResponse.statusCode).toBe(HttpStatus.CREATED);
    // Change status of registration to 'included'
    const changeStatusResponse = await changeRegistrationStatus({
      programId: programIdOCW,
      status: RegistrationStatusEnum.included,
      accessToken,
    });
    expect(changeStatusResponse.statusCode).toBe(HttpStatus.ACCEPTED);
    await waitForStatusChangeToComplete({
      programId: programIdOCW,
      amountOfRegistrations: 1,
      status: RegistrationStatusEnum.included,
      maxWaitTimeMs,
      accessToken,
    });
    // Make data change for registration
    await updateRegistration(
      programIdOCW,
      registrationVisa.referenceId,
      {
        [GenericRegistrationAttributes.preferredLanguage]:
          RegistrationPreferredLanguage.ar,
      },
      'test',
      accessToken,
    );
    // Duplicate registrations > including registration-events
    const duplicateRegistrationsResponse =
      await duplicateRegistrationsAndPaymentData({
        powerNumberRegistration: duplicateNumber,
        includeRegistrationEvents: true,
        accessToken,
        body: {
          secret: env.RESET_SECRET,
        },
      });
    expect(duplicateRegistrationsResponse.statusCode).toBe(HttpStatus.CREATED);

    // Get one page of events to test the duration of the api response
    const getEventsStartTime = Date.now();
    const paginatedEventsResponse = await getRegistrationEventsPaginated({
      programId: programIdOCW,
      accessToken,
      page: 1,
      limit: 10,
      search: 'e', // This is random filter to reduce result set, it seems likely that some field contains 'e'
      filter: {
        'filter.registrationProgramId': '2', // This is random filter to reduce result set, it seems likely that some registrationProgramIds are 2
      },
    });
    const getEventsElapsedTime = Date.now() - getEventsStartTime;

    const twoSeconds = 2 * 1000;
    expect(getEventsElapsedTime).toBeLessThan(twoSeconds); // local time was 911ms

    expect(paginatedEventsResponse.statusCode).toBe(HttpStatus.OK);

    // Get all events to simulate export
    const getAllEventsStartTime = Date.now();
    const allEventsResponse = await getRegistrationEventsPaginated({
      programId: programIdOCW,
      accessToken,
      page: 1,
      limit: supportedNumberOfRecords,
    });
    const allEvents = allEventsResponse.body.data;
    const expectedEvents = Math.pow(2, duplicateNumber); // each registration has 1 data change. Status changes are excluded here for now.
    expect(allEvents.length).toBe(expectedEvents);
    const getAllEventsElapsedTime = Date.now() - getAllEventsStartTime;

    const tenSeconds = 10 * 1000;
    expect(getAllEventsElapsedTime).toBeLessThan(tenSeconds); // local time was 6471ms
  });
});
