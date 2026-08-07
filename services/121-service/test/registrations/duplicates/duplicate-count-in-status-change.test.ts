import { HttpStatus } from '@nestjs/common';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  changeRegistrationStatus,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  registrationOCW1,
  registrationOCW2,
  registrationOCW4,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Duplicate count in status change dry-run', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB({ seedScript: SeedScript.nlrcMultiple });
    accessToken = await getAccessToken();
  });

  it('should return duplicateCount > 0 when changing status to included with duplicate registrations', async () => {
    // Arrange: create two registrations with same whatsappPhoneNumber (duplicateCheck attribute)
    const registration1 = {
      ...registrationOCW1,
      whatsappPhoneNumber: '14155230001',
    };
    const registration2 = {
      ...registrationOCW2,
      whatsappPhoneNumber: '14155230001', // Same as registration1 to trigger duplicate
    };
    await importRegistrations(
      programIdOCW,
      [registration1, registration2],
      accessToken,
    );

    // Act: dry-run status change to included
    const dryRunResponse = await changeRegistrationStatus({
      programId: programIdOCW,
      referenceIds: [registration1.referenceId, registration2.referenceId],
      status: RegistrationStatusEnum.included,
      accessToken,
      options: { dryRun: true },
    });

    // Assert
    expect(dryRunResponse.statusCode).toBe(HttpStatus.OK);
    expect(dryRunResponse.body.applicableCount).toBe(2);
    expect(dryRunResponse.body.duplicateCount).toBe(2);
  });

  it('should return duplicateCount 0 when changing status to included with unique registrations', async () => {
    // Arrange: create two registrations with different duplicate-checked attributes
    const registration1 = {
      ...registrationOCW1,
      whatsappPhoneNumber: '14155230001',
      phoneNumber: '14155230001',
    };
    const registration2 = {
      ...registrationOCW2,
      whatsappPhoneNumber: '14155230002',
      phoneNumber: '14155230002',
    };
    await importRegistrations(
      programIdOCW,
      [registration1, registration2],
      accessToken,
    );

    // Act: dry-run status change to included
    const dryRunResponse = await changeRegistrationStatus({
      programId: programIdOCW,
      referenceIds: [registration1.referenceId, registration2.referenceId],
      status: RegistrationStatusEnum.included,
      accessToken,
      options: { dryRun: true },
    });

    // Assert
    expect(dryRunResponse.statusCode).toBe(HttpStatus.OK);
    expect(dryRunResponse.body.applicableCount).toBe(2);
    expect(dryRunResponse.body.duplicateCount).toBe(0);
  });

  it('should return duplicateCount 0 when changing status to something other than included', async () => {
    // Arrange: create registrations with same phone (would be duplicates)
    const registration1 = {
      ...registrationOCW1,
      whatsappPhoneNumber: '14155230001',
    };
    const registration2 = {
      ...registrationOCW2,
      whatsappPhoneNumber: '14155230001',
    };
    await importRegistrations(
      programIdOCW,
      [registration1, registration2],
      accessToken,
    );

    // Act: dry-run status change to validated (not included)
    const dryRunResponse = await changeRegistrationStatus({
      programId: programIdOCW,
      referenceIds: [registration1.referenceId, registration2.referenceId],
      status: RegistrationStatusEnum.validated,
      accessToken,
      options: { dryRun: true },
    });

    // Assert: duplicateCount should be 0 because check only runs for 'included'
    expect(dryRunResponse.statusCode).toBe(HttpStatus.OK);
    expect(dryRunResponse.body.duplicateCount).toBe(0);
  });

  it('should only count duplicates within the selected registrations', async () => {
    // Arrange: create 3 registrations, 2 duplicates and 1 unique
    const registration1 = {
      ...registrationOCW1,
      whatsappPhoneNumber: '14155230001',
    };
    const registration2 = {
      ...registrationOCW2,
      whatsappPhoneNumber: '14155230001', // Duplicate of registration1
    };
    const registration3 = {
      ...registrationOCW4,
      whatsappPhoneNumber: '14155230003', // Unique
    };
    await importRegistrations(
      programIdOCW,
      [registration1, registration2, registration3],
      accessToken,
    );

    // Act: dry-run status change to included for only the unique registration
    const dryRunResponse = await changeRegistrationStatus({
      programId: programIdOCW,
      referenceIds: [registration3.referenceId],
      status: RegistrationStatusEnum.included,
      accessToken,
      options: { dryRun: true },
    });

    // Assert: should be 0 because the selected registration is not a duplicate
    expect(dryRunResponse.statusCode).toBe(HttpStatus.OK);
    expect(dryRunResponse.body.applicableCount).toBe(1);
    expect(dryRunResponse.body.duplicateCount).toBe(0);
  });
});
