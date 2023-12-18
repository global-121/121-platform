import { RegistrationStatusEnum } from '../../../src/registration/enum/registration-status.enum';
import { SeedScript } from '../../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../../src/shared/enum/program-phase.model';
import {
  changePhase,
  waitForStatusUpdateToComplete,
} from '../../helpers/program.helper';
import {
  awaitChangePaStatus,
  getRegistrations,
  importRegistrations,
} from '../../helpers/registration.helper';
import { getAccessToken, resetDB } from '../../helpers/utility.helper';
import {
  programIdOCW,
  registration1,
  registration3,
  registration4,
  registration5,
} from './pagination-data';

describe('change the status of a set of registrations', () => {
  let accessToken: string;
  const registrations = [
    registration1,
    registration3,
    registration5,
    registration4,
  ];
  const oldStatus = RegistrationStatusEnum.registered;
  const referenceIds = registrations.map(
    (registration) => registration.referenceId,
  );

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    await changePhase(
      programIdOCW,
      ProgramPhase.registrationValidation,
      accessToken,
    );

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
      50000,
      newStatus,
    );
    const getRegistrationsResponse = await getRegistrations(
      programIdOCW,
      null,
      accessToken,
      null,
      null,
    );
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
    const newStatus = RegistrationStatusEnum.inclusionEnded; // registered to inclusion-ended IS NOT possible

    // Act
    const updateStatusResponse = await awaitChangePaStatus(
      programIdOCW,
      referenceIds,
      newStatus,
      accessToken,
    );
    const getRegistrationsResponse = await getRegistrations(
      programIdOCW,
      null,
      accessToken,
    );
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
    const getRegistrationsResponse = await getRegistrations(
      programIdOCW,
      null,
      accessToken,
      null,
      null,
    );
    const data = getRegistrationsResponse.body.data;

    // Assert
    expect(updateStatusResponse.body.totalFilterCount).toBe(0);
    expect(updateStatusResponse.body.applicableCount).toBe(0);
    for (const registration of data) {
      expect(registration.status).toBe(oldStatus);
    }
  });
});
