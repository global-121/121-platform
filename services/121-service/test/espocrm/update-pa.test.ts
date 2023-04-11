import { HttpStatus } from '@nestjs/common';
import { EspoCrmActionTypeEnum } from '../../src/espocrm/espocrm-action-type.enum';
import { EspoCrmEntityTypeEnum } from '../../src/espocrm/espocrm-entity-type';
import { FspName } from '../../src/fsp/enum/fsp-name.enum';
import { SeedScript } from '../../src/scripts/scripts.controller';
import {
  createEspoSignature,
  setupEspoCrmWebhook,
} from '../helpers/espocrm.helper';
import {
  deleteRegistrations,
  getRegistration,
  importRegistrations,
} from '../helpers/registration.helper';
import { getIsDebug, getServer, resetDB } from '../helpers/utility.helper';

describe('Webhook integration with EspoCRM', () => {
  const ip = '127.0.0.1';
  const programId = 3;
  const referenceId = '63e62864557597e0d';
  const registration = {
    referenceId: referenceId,
    preferredLanguage: 'en',
    paymentAmountMultiplier: 1,
    firstName: 'John',
    lastName: 'Smith',
    phoneNumber: '14155238886',
    fspName: FspName.intersolveVisa,
    whatsappPhoneNumber: '14155238886',
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
  });

  describe('Update PA', () => {
    beforeEach(async () => {
      await importRegistrations(programId, [registration], accessToken);
    });

    afterEach(async () => {
      await deleteRegistrations(programId, { referenceIds: [referenceId] });
    });

    it('should not update without signature', async () => {
      await getServer()
        .post(testEndpoint)
        .set('x-forwarded-for', ip)
        .set('x-signature', 'invalid')
        .send([
          {
            id: referenceId,
            firstName: 'UpdatedName',
          },
        ])
        .expect(getIsDebug() ? HttpStatus.CREATED : HttpStatus.FORBIDDEN);

      const registration = await getRegistration(referenceId);

      expect(registration.body.referenceId).toBe(referenceId);
      expect(registration.body.firstName).not.toBe('UpdatedName ');
    });

    it('should not update unknown registrations', async () => {
      const testBody = [
        {
          id: referenceId + '-fail-test',
          firstName: 'UpdatedName',
        },
      ];
      const signature = createEspoSignature(
        testBody,
        webhookObject.secretKey,
        webhookObject.referenceId,
      );
      await getServer()
        .post(testEndpoint)
        .set('x-forwarded-for', ip)
        .set('x-signature', signature)
        .send(testBody)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should succesfully update', async () => {
      const updatedName = 'UpdatedName';
      const testBody = [
        {
          id: referenceId,
          firstName: updatedName,
        },
      ];
      const signature = createEspoSignature(
        testBody,
        webhookObject.secretKey,
        webhookObject.referenceId,
      );
      await getServer()
        .post(testEndpoint)
        .set('x-forwarded-for', ip)
        .set('x-signature', signature)
        .send(testBody)
        .expect(HttpStatus.CREATED);

      const registration = await getRegistration(referenceId);
      expect(registration.body.customData.firstName).toBe(updatedName);
    });
  });
});
