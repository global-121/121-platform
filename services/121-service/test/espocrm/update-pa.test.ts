import { HttpStatus } from '@nestjs/common';
import { EspoCrmActionTypeEnum } from '../../src/espocrm/espocrm-action-type.enum';
import { EspoCrmEntityTypeEnum } from '../../src/espocrm/espocrm-entity-type';
import { FspName } from '../../src/fsp/enum/fsp-name.enum';
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

describe('Webhook integration with EspoCRM - Update PA', () => {
  const ip = '127.0.0.1';
  const programId = 3;
  const referenceId = 'referenceId-for-update-pa-test';
  const registration = {
    referenceId: referenceId,
    preferredLanguage: 'en',
    paymentAmountMultiplier: 1,
    firstName: 'John',
    lastName: 'Smith',
    phoneNumber: '15005550098',
    fspName: FspName.intersolveVisa,
    whatsappPhoneNumber: '15005550098',
    tokenCodeVisa: true,
    isPhysicalCardVisa: true,
  };
  const webhookObject = {
    referenceId: '63f77488410458465',
    actionType: EspoCrmActionTypeEnum.update,
    entityType: EspoCrmEntityTypeEnum.registration,
    secretKey: 'secret-key',
  };
  let accessToken: string;

  const testEndpoint = '/espocrm/update-registration';

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

  itSkipIfDebug('should not update without signature', async () => {
    // Arrange
    const signature = 'invalid';
    const testName = 'UpdatedName';

    // Act
    const response = await getServer()
      .post(testEndpoint)
      .set('x-forwarded-for', ip)
      .set('x-signature', signature)
      .send([
        {
          id: referenceId,
          firstName: testName,
        },
      ])
      .expect(HttpStatus.FORBIDDEN);

    // Assert
    expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);

    const registration = await getRegistration(referenceId, accessToken);

    expect(registration.body.referenceId).toBe(referenceId);
    expect(registration.body.firstName).not.toBe(testName);
  });

  it('should not update unknown registrations', async () => {
    // Arrange
    const testBody = [
      {
        id: referenceId + '-fail-test',
        phoneNumber: '15005550099',
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
    expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
  });

  it('should succesfully update', async () => {
    // Arrange
    const updatePhoneNumber = '15005550099';
    const testBody = [
      {
        id: referenceId,
        phoneNumber: updatePhoneNumber,
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
    expect(registration.body.phoneNumber).toBe(updatePhoneNumber);
  });
});
