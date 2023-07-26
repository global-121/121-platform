import { HttpStatus } from '@nestjs/common';
import { EspoCrmActionTypeEnum } from '../../src/espocrm/espocrm-action-type.enum';
import { EspoCrmEntityTypeEnum } from '../../src/espocrm/espocrm-entity-type';
import { FspName } from '../../src/fsp/enum/fsp-name.enum';
import { RegistrationStatusEnum } from '../../src/registration/enum/registration-status.enum';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import {
  createEspoSignature,
  setupEspoCrmWebhook,
} from '../helpers/espocrm.helper';
import {
  deleteRegistrations,
  getRegistration,
  importRegistrations,
} from '../helpers/registration.helper';
import { getServer, itSkipIfDebug, resetDB } from '../helpers/utility.helper';

describe('Webhook integration with EspoCRM - Delete PA', () => {
  const ip = '127.0.0.1';
  const programId = 3;
  const referenceId = 'referenceId-for-delete-pa-test';
  const registration = {
    referenceId: referenceId,
    preferredLanguage: 'en',
    paymentAmountMultiplier: 1,
    firstName: 'John',
    lastName: 'Smith',
    phoneNumber: '15005550099',
    fspName: FspName.intersolveVisa,
    whatsappPhoneNumber: '15005550099',
  };
  const webhookObject = {
    referenceId: '63f77488410458466',
    actionType: EspoCrmActionTypeEnum.delete,
    entityType: EspoCrmEntityTypeEnum.registration,
    secretKey: 'secret-key',
  };
  let accessToken: string;

  const testEndpoint = '/espocrm/delete-registration';

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);

    accessToken = await setupEspoCrmWebhook(programId, webhookObject);

    await importRegistrations(programId, [registration], accessToken);
  });

  afterEach(async () => {
    await deleteRegistrations(
      programId,
      { referenceIds: [referenceId] },
      accessToken,
    );
  });

  itSkipIfDebug('should not delete without signature', async () => {
    // Arrange
    const signature = 'invalid';

    // Act
    const response = await getServer()
      .post(testEndpoint)
      .set('x-forwarded-for', ip)
      .set('x-signature', signature)
      .send([
        {
          id: referenceId,
        },
      ]);

    // Assert
    expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);

    const registration = await getRegistration(referenceId, accessToken);

    expect(registration.body.referenceId).toBe(referenceId);
    expect(registration.body.registrationStatus).not.toBe(
      RegistrationStatusEnum.deleted,
    );
  });

  it('should not delete unknown registrations', async () => {
    // Arrange
    const testBody = [
      {
        id: referenceId + '-fail-test',
      },
    ];
    const signature = createEspoSignature(
      testBody,
      webhookObject.secretKey,
      webhookObject.referenceId,
    );

    // Act
    const registration = await getServer()
      .post(testEndpoint)
      .set('x-forwarded-for', ip)
      .set('x-signature', signature)
      .send(testBody);

    // Assert
    expect(registration.statusCode).toBe(HttpStatus.NOT_FOUND);
    expect(registration.body.errors.length).not.toBe(0);
  });

  it('should succesfully delete', async () => {
    // Arrange
    const testBody = [
      {
        id: referenceId,
      },
    ];
    const signature = createEspoSignature(
      testBody,
      webhookObject.secretKey,
      webhookObject.referenceId,
    );

    // Act
    const response = await getServer()
      .post(testEndpoint)
      .set('x-forwarded-for', ip)
      .set('x-signature', signature)
      .send(testBody);

    // Assert
    expect(response.statusCode).toBe(HttpStatus.CREATED);

    const registration = await getRegistration(referenceId, accessToken);

    expect(registration.body.registrationStatus).toBe(
      RegistrationStatusEnum.deleted,
    );
  });
});
