import { HttpStatus } from '@nestjs/common';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationEventEnum } from '@121-service/src/registration-events/enum/registration-event.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { waitForStatusUpdateToComplete } from '@121-service/test/helpers/program.helper';
import {
  awaitChangeRegistrationStatus,
  changeRegistrationStatus,
  getRegistrationEvents,
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
  const oldStatus = RegistrationStatusEnum.new;
  const referenceIds = registrations.map(
    (registration) => registration.referenceId,
  );

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();

    await importRegistrations(programIdOCW, registrations, accessToken);
  });

  it('should update statuses if possible', async () => {
    // Arrange
    // NOTE: because the helper-function changePaStatus already uses an filter on IN(..referenceIds) this also already tests the scenario where in the front-end manually multiple rows are selected (instead of 'select all')
    const newStatus = RegistrationStatusEnum.included; // 'new' to included IS possible
    const reason = 'new status';
    // Act
    const updateStatusResponse = await awaitChangeRegistrationStatus({
      programId: programIdOCW,
      referenceIds,
      status: newStatus,
      accessToken,
      options: { reason },
    });
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
    const registrations = getRegistrationsResponse.body.data;

    const eventsResponse = await getRegistrationEvents({
      programId: programIdOCW,
      accessToken,
    });

    // Assert
    expect(updateStatusResponse.body.totalFilterCount).toBe(
      registrations.length,
    );
    expect(updateStatusResponse.body.applicableCount).toBe(
      registrations.length,
    );
    for (const registration of registrations) {
      expect(registration.status).toBe(newStatus);
      // For each registration status change, there should be an event with a reason
      const event = eventsResponse.body.data.find(
        (event) =>
          event.registrationId === registration.id &&
          event.newValue === newStatus,
      );

      expect(event).toBeDefined();

      const expectedEvent = {
        type: RegistrationEventEnum.registrationStatusChange,
        oldValue: RegistrationStatusEnum.new,
        newValue: newStatus,
        reason,
      };
      expect(event).toMatchObject(expectedEvent);
    }
  });

  it('if a status change is not possible, it should not update the status', async () => {
    // All combinations of status changes are tested in the file status-change.helper.spec.ts,
    // here we only test one scenario where a status change is not possible to check that the api reponds correctly on an failed status change update attempt

    // Arrange
    // First change status to declined as from new you can move to any status which is not suitable for the test case
    const declinedStatus = RegistrationStatusEnum.declined;
    await awaitChangeRegistrationStatus({
      programId: programIdOCW,
      referenceIds,
      status: declinedStatus,
      accessToken,
    });
    const pausedStatus = RegistrationStatusEnum.paused; // 'declined' to 'paused' is NOT possible, so no status should be updated in the end

    // Act
    const updateStatusResponse = await awaitChangeRegistrationStatus({
      programId: programIdOCW,
      referenceIds,
      status: pausedStatus,
      accessToken,
    });
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
      expect(registration.status).toBe(declinedStatus);
    }
  });

  it('should update statuses if possible, with initial filter on status applied', async () => {
    // Arrange
    // This represents the situation where in the front-end you are filtered on ceratin statuses and then click 'select all'
    const newStatus = RegistrationStatusEnum.included; // 'new' to 'included' IS possible
    const filter = {};
    filter[`filter.status`] = RegistrationStatusEnum.included; // but initial filter on included PAs leaves empty set as they are now registered

    // Act
    const updateStatusResponse = await awaitChangeRegistrationStatus({
      programId: programIdOCW,
      referenceIds,
      status: newStatus,
      accessToken,
      options: { filter },
    });
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

  describe('check if a reason is required', () => {
    it('should require a reason to update a registration status for some status declined and paused', async () => {
      // Arrange
      // Deleted status is not tested here, because it uses a different endpoint
      // and is tested in a separate test file
      const statusesThatRequireReason = [
        RegistrationStatusEnum.declined,
        RegistrationStatusEnum.paused,
      ];

      for (const status of statusesThatRequireReason) {
        // Act
        const updateStatusResponse = await changeRegistrationStatus({
          programId: programIdOCW,
          referenceIds,
          status,
          accessToken,
          options: { reason: null },
        });

        // Assert
        expect(updateStatusResponse.status).toBe(400);
      }
    });

    it('should not require a reason to update a registration status for some status validated and included', async () => {
      // Arrange
      // Only statuses that can be changed in a bulk update are tested here
      const statusesThatDoNotRequireReason = [
        RegistrationStatusEnum.validated,
        RegistrationStatusEnum.included,
      ];

      for (const status of statusesThatDoNotRequireReason) {
        // Act
        const updateStatusResponse = await awaitChangeRegistrationStatus({
          programId: programIdOCW,
          referenceIds,
          status,
          accessToken,
          options: { reason: null },
        });

        // Assert
        expect(updateStatusResponse.status).toBe(HttpStatus.ACCEPTED);
      }
    });
  });
});
