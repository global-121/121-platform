import { HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import path from 'path';
import { env } from 'process';

import { GenericRegistrationAttributes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { MASS_UPDATE_ROW_LIMIT } from '@121-service/src/registration/services/registrations-import.service';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { getRegistrationEventsPaginated } from '@121-service/test/helpers/program.helper';
import {
  bulkUpdateRegistrationsCSV,
  changeRegistrationStatus,
  duplicateRegistrations,
  exportRegistrations,
  importRegistrations,
  jsonToCsv,
  waitForBulkRegistrationChanges,
  waitForStatusChangeToComplete,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { programIdOCW } from '@121-service/test/registrations/pagination/pagination-data';

const duplicateNumber = parseInt(env.DUPLICATE_NUMBER || '5'); // cronjob duplicate number should be 2^17 = 131072

const supportedNumberOfRecords = 300_000; // Adjust based on expected supported number
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

    // Duplicate registrations
    const duplicateRegistrationsResponse = await duplicateRegistrations({
      powerNumberRegistration: duplicateNumber,
      accessToken,
      body: {
        secret: env.RESET_SECRET,
      },
    });
    expect(duplicateRegistrationsResponse.statusCode).toBe(HttpStatus.CREATED);

    // Change status of all registration to 'included'
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

    // Do bulk update by ..
    // .. first export registrations
    const exportRegistrationsResponse = await exportRegistrations(
      programIdOCW,
      GenericRegistrationAttributes.preferredLanguage,
      accessToken,
    );
    expect(exportRegistrationsResponse.statusCode).toBe(HttpStatus.OK);
    // .. then change preferredLanguage to Arabic
    const responseObj = exportRegistrationsResponse.body;
    const registrations = responseObj.data;
    for (const registration of registrations) {
      registration.preferredLanguage = LanguageEnum.ar;
    }
    // Split into chunks of 50,000 as this is the import-limit
    const chunkSize = MASS_UPDATE_ROW_LIMIT;
    for (let i = 0; i < registrations.length; i += chunkSize) {
      console.log('i: ', i);
      const chunk = registrations.slice(i, i + chunkSize);
      const csvFile = jsonToCsv(chunk);
      const tempFilePath = path.join(
        __dirname,
        `registrations-part-${i / chunkSize + 1}.csv`,
      );
      fs.writeFileSync(tempFilePath, csvFile);
      const startTime = Date.now();
      const bulkUpdate = await bulkUpdateRegistrationsCSV(
        programIdOCW,
        tempFilePath,
        accessToken,
        'bulk update',
      );
      const elapsedTime = Date.now() - startTime;
      fs.unlinkSync(tempFilePath);
      expect(elapsedTime).toBeLessThan(80_000); // 80000 ms = 80 seconds
      expect(bulkUpdate.statusCode).toBe(HttpStatus.OK);
    }
    // Wait for bulk update to complete
    await waitForBulkRegistrationChanges({
      expectedChangesOrPatch: {
        expectedPatch: { preferredLanguage: LanguageEnum.ar },
      },
      programId: programIdOCW,
      accessToken,
      maxWaitTimeMs: testTimeout, // this takes very long
    });

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
    expect(getEventsElapsedTime).toBeLessThan(twoSeconds);

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
    const expectedEvents = Math.pow(2, duplicateNumber) * 2 + 1; // each registration has 2 events (status change + bulk update) + there is one initial status change event for the first imported registration
    expect(allEvents.length).toBe(expectedEvents);
    const getAllEventsElapsedTime = Date.now() - getAllEventsStartTime;

    const twoMinutes = 2 * 60 * 1000;
    expect(getAllEventsElapsedTime).toBeLessThan(twoMinutes);
  });
});
