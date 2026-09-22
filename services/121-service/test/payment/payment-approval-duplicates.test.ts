import { HttpStatus } from '@nestjs/common';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  approvePayment,
  createPayment,
} from '@121-service/test/helpers/program.helper';
import {
  awaitChangeRegistrationStatus,
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

describe('Payment approval blocked by duplicate registrations', () => {
  let accessToken: string;
  const transferValue = 25;

  beforeEach(async () => {
    await resetDB({ seedScript: SeedScript.nlrcMultiple });
    accessToken = await getAccessToken();
  });

  it('should reject payment approval when registrations have duplicate status', async () => {
    // Arrange: create duplicate registrations and include them
    const registration1 = {
      ...registrationOCW1,
      whatsappPhoneNumber: '14155230001',
    };
    const registration2 = {
      ...registrationOCW2,
      whatsappPhoneNumber: '14155230001', // Same = duplicate
    };
    await importRegistrations(
      programIdOCW,
      [registration1, registration2],
      accessToken,
    );

    const referenceIds = [registration1.referenceId, registration2.referenceId];

    await awaitChangeRegistrationStatus({
      programId: programIdOCW,
      referenceIds,
      status: RegistrationStatusEnum.included,
      accessToken,
    });

    // Create payment
    const createPaymentResponse = await createPayment({
      programId: programIdOCW,
      transferValue,
      referenceIds,
      accessToken,
    });
    expect(createPaymentResponse.status).toBe(HttpStatus.CREATED);
    const paymentId = createPaymentResponse.body.id;

    // Act: attempt to approve payment with duplicate registrations
    const approveResponse = await approvePayment({
      programId: programIdOCW,
      paymentId,
      accessToken,
    });

    // Assert: approval should be rejected
    expect(approveResponse.status).toBe(HttpStatus.BAD_REQUEST);
    expect(approveResponse.body.message).toContain('duplicate status');
  });

  it('should allow payment approval when registrations are unique', async () => {
    // Arrange: create unique registrations and include them
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

    const referenceIds = [registration1.referenceId, registration2.referenceId];

    await awaitChangeRegistrationStatus({
      programId: programIdOCW,
      referenceIds,
      status: RegistrationStatusEnum.included,
      accessToken,
    });

    // Create payment
    const createPaymentResponse = await createPayment({
      programId: programIdOCW,
      transferValue,
      referenceIds,
      accessToken,
    });
    expect(createPaymentResponse.status).toBe(HttpStatus.CREATED);
    const paymentId = createPaymentResponse.body.id;

    // Act: approve payment with unique registrations
    const approveResponse = await approvePayment({
      programId: programIdOCW,
      paymentId,
      accessToken,
    });

    // Assert: approval should succeed
    expect(approveResponse.status).toBe(HttpStatus.CREATED);
  });

  it('should report duplicateCount in payment dry-run response', async () => {
    // Arrange: create duplicate registrations and include them
    const registration1 = {
      ...registrationOCW1,
      whatsappPhoneNumber: '14155230001',
    };
    const registration2 = {
      ...registrationOCW2,
      whatsappPhoneNumber: '14155230001', // Same = duplicate
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

    const referenceIds = [
      registration1.referenceId,
      registration2.referenceId,
      registration3.referenceId,
    ];

    await awaitChangeRegistrationStatus({
      programId: programIdOCW,
      referenceIds,
      status: RegistrationStatusEnum.included,
      accessToken,
    });

    // Act: dry-run payment creation
    const dryRunResponse = await createPayment({
      programId: programIdOCW,
      transferValue,
      referenceIds,
      accessToken,
      filter: { dryRun: 'true' },
    });

    // Assert: dry-run should report duplicate count
    expect(dryRunResponse.status).toBe(HttpStatus.OK);
    expect(dryRunResponse.body.duplicateCount).toBe(2);
    expect(dryRunResponse.body.applicableCount).toBe(3);
  });
});
