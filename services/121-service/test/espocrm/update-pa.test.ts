import { publishProgram } from '../helpers/program.helper';
import {
  deleteRegistrations,
  getRegistration,
  importRegistrations,
} from '../helpers/registration.helper';
import {
  createEspoSignature,
  getIsDebug,
  getServer,
  login,
  resetDB,
} from '../helpers/utility.helper';

const server = getServer();
const ip = '127.0.0.1';
const seedScript = 'nlrc-multiple';
const programId = 3;
const referenceId = '63e62864557597e0d';
const registration = {
  referenceId: referenceId,
  preferredLanguage: 'en',
  paymentAmountMultiplier: 1,
  firstName: 'John',
  lastName: 'Smith',
  phoneNumber: 14155238886,
  fspName: 'Intersolve-visa',
  whatsappPhoneNumber: 14155238886,
  tokenCodeVisa: true,
  isPhysicalCardVisa: true,
};
const webhookObject = {
  referenceId: '63f77488410458465',
  actionType: 'update',
  entityType: 'registration',
  secretKey: 'secret-key',
};
let access_token: string;

describe('Webhook integration with espocrm', () => {
  beforeEach(async () => {
    await resetDB(seedScript);
    const loginResponse = await login();
    access_token = loginResponse.headers['set-cookie'][0].split(';')[0];
    await publishProgram(programId);
    await server
      .post('/espocrm/webhooks')
      .set('Cookie', [access_token])
      .send(webhookObject);
  });

  describe('Update PA', () => {
    beforeEach(async () => {
      await importRegistrations(programId, [registration], access_token);
    });

    afterEach(async () => {
      await deleteRegistrations(programId, { referenceIds: [referenceId] });
    });

    it('should not update without signature', async () => {
      await server
        .post('/espocrm/update-registration')
        .send([
          {
            id: referenceId,
            firstName: 'UpdatedName',
          },
        ])
        .expect(getIsDebug ? 201 : 403);
    });

    it('should not update unknown registrations', async () => {
      const updateBody = [
        {
          id: referenceId + '-fail-test',
          firstName: 'UpdatedName',
        },
      ];
      const signature = createEspoSignature(
        updateBody,
        webhookObject.secretKey,
        webhookObject.referenceId,
      );
      await server
        .post('/espocrm/update-registration')
        .set('x-forwarded-for', ip)
        .set('x-signature', signature)
        .send(updateBody)
        .expect(404);
    });

    it('should succesfully update', async () => {
      const updatedName = 'UpdatedName';
      const updateBody = [
        {
          id: referenceId,
          firstName: updatedName,
        },
      ];
      const signature = createEspoSignature(
        updateBody,
        webhookObject.secretKey,
        webhookObject.referenceId,
      );
      await server
        .post('/espocrm/update-registration')
        .set('x-forwarded-for', ip)
        .set('x-signature', signature)
        .send(updateBody)
        .expect(201);

      const getRegistrationRes = await getRegistration(referenceId);
      expect(getRegistrationRes.body.customData.firstName).toBe(updatedName);
    });
  });
});
