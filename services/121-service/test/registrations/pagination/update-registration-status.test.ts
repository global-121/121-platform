import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { waitForStatusUpdateToComplete } from '@121-service/test/helpers/program.helper';
import {
  awaitChangePaStatus,
  getRegistrations,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  registrationOCW1,
  registrationOCW3,
  registrationOCW4,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('change the status of a set of registrations', () => {
  let accessToken: string;
  const registrations = [
    registrationOCW1,
    registrationOCW3,
    registrationPV5,
    registrationOCW4,
  ];
  const oldStatus = RegistrationStatusEnum.registered;
  const referenceIds = registrations.map(
    (registration) => registration.referenceId,
  );

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    await importRegistrations(programIdOCW, registrations, accessToken);
  });

  it('should update statuses if possible', async () => {
    // Arrange
    // NOTE: because the helper-function changePaStatus already uses an filter on IN(..referenceIds) this also already tests the scenario where in the front-end manually multiple rows are selected (instead of 'select all')
    const newStatus = RegistrationStatusEnum.included; // registered to included IS possible

    // Act
    const updateStatusResponse = await awaitChangePaStatus(
      programIdOCW,
      referenceIds,
      newStatus,
      accessToken,
    );
    await waitForStatusUpdateToComplete(
      programIdOCW,
      referenceIds,
      accessToken,
      50_000,
      newStatus,
    );
    const getRegistrationsResponse = await getRegistrations({
      programId: programIdOCW,
      accessToken,
    });
    const data = getRegistrationsResponse.body.data;

    // Assert
    expect(updateStatusResponse.body.totalFilterCount).toBe(
      registrations.length,
    );
    expect(updateStatusResponse.body.applicableCount).toBe(
      registrations.length,
    );
    for (const registration of data) {
      expect(registration.status).toBe(newStatus);
    }
  });

  it('should not update statuses if not possible', async () => {
    // Arrange
    const newStatus = RegistrationStatusEnum.paused; // registered to paused IS NOT possible

    // Act
    const updateStatusResponse = await awaitChangePaStatus(
      programIdOCW,
      referenceIds,
      newStatus,
      accessToken,
    );
    const getRegistrationsResponse = await getRegistrations({
      programId: programIdOCW,
      accessToken,
    });
    const data = getRegistrationsResponse.body.data;

    // Assert
    expect(updateStatusResponse.body.totalFilterCount).toBe(
      registrations.length,
    );
    expect(updateStatusResponse.body.applicableCount).toBe(0);
    for (const registration of data) {
      expect(registration.status).toBe(oldStatus);
    }
  });

  it('should update statuses if possible, with initial filter on status applied', async () => {
    // Arrange
    // This represents the situation where in the front-end you are filtered on ceratin statuses and then click 'select all'
    const newStatus = RegistrationStatusEnum.included; // registered to included IS possible
    const filter = {};
    filter[`filter.status`] = RegistrationStatusEnum.included; // but initial filter on included PAs leaves empty set as they are now registered

    // Act
    const updateStatusResponse = await awaitChangePaStatus(
      programIdOCW,
      referenceIds,
      newStatus,
      accessToken,
      filter,
    );
    const getRegistrationsResponse = await getRegistrations({
      programId: programIdOCW,
      accessToken,
    });
    const data = getRegistrationsResponse.body.data;

    // Assert
    expect(updateStatusResponse.body.totalFilterCount).toBe(0);
    expect(updateStatusResponse.body.applicableCount).toBe(0);
    for (const registration of data) {
      expect(registration.status).toBe(oldStatus);
    }
  });
});
