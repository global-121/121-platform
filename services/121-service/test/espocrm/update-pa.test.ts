import {
  getServer,
  importRegistrations,
  login,
  publishProgram,
  resetDB,
} from '../helpers/helper';

const server = getServer();
const referenceId = '63e62864557597e0d';
describe('Webhook integration with espocrm', () => {
  beforeEach(async () => {
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
    await resetDB();
    await login();
    await publishProgram(3);
    await importRegistrations(3, [registration]);
    await server.post('/espocrm/update-registration').send({
      referenceId: '63f77488410458465',
      actionType: 'update',
      entityType: 'registration',
      secretKey: 'secret-key',
    });
  });

  describe('Update existing PA', () => {
    it('should show "up"', async () => {
      // const response = await server
      //   .post('/espocrm/update-registration')
      //   .send([
      //     {
      //       id: referenceId,
      //       firstName: 'UpdatedName',
      //     },
      //   ])
      //   .expect(200);
      // expect(response.body).toEqual({
      //   status: 'PA',
      //   referenceId: referenceId,
      // });
    });
  });
});
