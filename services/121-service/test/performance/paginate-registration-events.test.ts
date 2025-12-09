import { HttpStatus } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { Fsps } from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { GenericRegistrationAttributes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { getRegistrationEventsMonitoring } from '@121-service/test/helpers/program.helper';
import {
  createRegistrationUniques,
  duplicateRegistrationsAndPaymentData,
  getRegistrationEvents,
  importRegistrations,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { programIdOCW } from '@121-service/test/registrations/pagination/pagination-data';

const duplicateLowNumber = 5;
const duplicateHighNumber = 16; // cronjob duplicate number should be 2^16 = 64k registrations * 2 = 131k
const testTimeout = 5_400_000; // 90 minutes
const duplicateNumber =
  // eslint-disable-next-line n/no-process-env -- Required to detect high data volume mode for performance testing
  process.env.HIGH_DATA_VOLUME === 'true'
    ? duplicateHighNumber
    : duplicateLowNumber;

jest.setTimeout(testTimeout);
describe('Get paginated registrations events', () => {
  let accessToken: string;

  it('Should get registration events for 100k registrations within acceptable time', async () => {
    /////////////
    // Arrange //
    /////////////
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();

    // Import 2 duplicate registrations
    const registrationVisa2 = {
      ...registrationVisa,
      referenceId: 'perf-test-002',
    };
    const importRegistrationResponse = await importRegistrations(
      programIdOCW,
      [registrationVisa, registrationVisa2],
      accessToken,
    );
    expect(importRegistrationResponse.statusCode).toBe(HttpStatus.CREATED);
    // Make data change & FSP change for 1 registration
    await updateRegistration(
      programIdOCW,
      registrationVisa.referenceId,
      {
        [GenericRegistrationAttributes.preferredLanguage]:
          RegistrationPreferredLanguage.ar,
        [GenericRegistrationAttributes.programFspConfigurationName]:
          Fsps.intersolveVoucherWhatsapp,
      },
      'test',
      accessToken,
    );
    // Mark pair as unique
    await createRegistrationUniques({
      programId: programIdOCW,
      registrationIds: [2, 4], // These are the ids of the 2 imported registrations
      accessToken,
      reason: 'test',
    });
    // Multiply registrations > including registration-events
    const multiplyRegistrationsResponse =
      await duplicateRegistrationsAndPaymentData({
        powerNumberRegistration: duplicateNumber,
        includeRegistrationEvents: true,
        accessToken,
        body: {
          secret: env.RESET_SECRET,
        },
      });
    expect(multiplyRegistrationsResponse.statusCode).toBe(HttpStatus.CREATED);

    // Get one page of events to test the duration of the api response
    const getEventsStartTime = Date.now();
    const paginatedEventsResponse = await getRegistrationEventsMonitoring({
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

    // Get all events for export
    const getAllEventsStartTime = Date.now();
    const allEventsResponse = await getRegistrationEvents({
      programId: programIdOCW,
      accessToken,
    });
    const allEvents = allEventsResponse.body.data;
    const nrOfRegistrations = 2 * Math.pow(2, duplicateNumber);
    const expectedEvents = nrOfRegistrations * 3; // Half of the registrations has 4 events (status/data/FSP/unique), and half has 2 events (status/unique), so on average 3.
    expect(allEvents.length).toBe(expectedEvents);
    const getAllEventsElapsedTime = Date.now() - getAllEventsStartTime;

    const tenSeconds = 10 * 1000;
    expect(getAllEventsElapsedTime).toBeLessThan(tenSeconds); // local time was 6471ms
  });
});
