import {
  createEspoSignature,
  deleteRegistrations,
  getIsDebug,
  getServer,
  importRegistrations,
  login,
  publishProgram,
  resetDB,
} from '../helpers/helper';

const server = getServer();
const ip = '127.0.0.1';
const programId = 3;
const referenceId = '63e62864557597e0d';
const registration = {
  referenceId: referenceId,
  preferredLanguage: 'en',
  paymentAmountMultiplier: 1,
  nameFirst: 'John',
  nameLast: 'Smith',
  phoneNumber: 14155238886,
  fspName: 'Intersolve-visa',
  whatsappPhoneNumber: 14155238886,
  tokenCodeVisa: true,
  isPhysicalCardVisa: true,
};
const webhookObject = {
  referenceId: '642bf8596bad2b775',
  actionType: 'delete',
  entityType: 'registration',
  secretKey: 'secret-key',
};
let access_token: string;

describe('Webhook integration with espocrm', () => {
  beforeEach(async () => {
    await resetDB();
    const loginResponse = await login();
    access_token = loginResponse.headers['set-cookie'][0].split(';')[0];
    await publishProgram(programId);
    await server
      .post('/espocrm/webhooks')
      .set('Cookie', [access_token])
      .send(webhookObject);
  });

  describe('Delete PA', () => {
    beforeEach(async () => {
      await importRegistrations(programId, [registration], access_token);
    });

    afterEach(async () => {
      await deleteRegistrations(programId, { referenceIds: [referenceId] });
    });

    it('should not delete without signature', async () => {
      await server
        .post('/espocrm/delete-registration')
        .send([
          {
            id: referenceId,
          },
        ])
        .expect(getIsDebug ? 201 : 403);
    });

    it('should not delete unknown registrations', async () => {
      const deleteBody = [
        {
          id: referenceId + '-fail-test',
        },
      ];
      const signature = createEspoSignature(
        deleteBody,
        webhookObject.secretKey,
        webhookObject.referenceId,
      );
      await server
        .post('/espocrm/delete-registration')
        .set('x-forwarded-for', ip)
        .set('x-signature', signature)
        .send(deleteBody)
        .expect(404);
    });

    it('should succesfully delete', async () => {
      const deleteBody = [
        {
          id: referenceId,
        },
      ];
      const signature = createEspoSignature(
        deleteBody,
        webhookObject.secretKey,
        webhookObject.referenceId,
      );
      await server
        .post('/espocrm/delete-registration')
        .set('x-forwarded-for', ip)
        .set('x-signature', signature)
        .send(deleteBody)
        .expect(201);
    });
  });
});
