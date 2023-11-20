import { RegistrationStatusEnum } from '../../../src/registration/enum/registration-status.enum';
import { SeedScript } from '../../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../../src/shared/enum/program-phase.model';
import {
  changePhase,
  doPayment,
  waitForPaymentTransactionsToComplete,
} from '../../helpers/program.helper';
import {
  awaitChangePaStatus,
  getRegistrations,
  importRegistrations,
} from '../../helpers/registration.helper';
import { getAccessToken, resetDB } from '../../helpers/utility.helper';
import { PaymentFilterEnum } from './../../../src/registration/enum/payment-filter.enum';
import {
  createExpectedValueObject,
  expectedAttributes,
  programId,
  registration1,
  registration3,
  registration4,
  registration5,
} from './pagination-data';

describe('Load PA table', () => {
  describe('getting registration using paginate and filtering on payment', () => {
    registration3.lastName = 'mock-fail-create-customer';
    // This number implies that in mock-service no incoming 'yes' is triggered, so that the transaction stays on 'waiting'
    registration5.whatsappPhoneNumber = '15005550002';

    let accessToken: string;
    const payment1 = 1;
    const payment2 = 2;
    const amount = 10;
    const registrations = [
      registration1,
      registration3,
      registration5,
      registration4,
    ];
    const paymentReferenceIds = registrations.map(
      (registration) => registration.referenceId,
    );

    beforeAll(async () => {
      await resetDB(SeedScript.nlrcMultiple);
      accessToken = await getAccessToken();

      await changePhase(
        programId,
        ProgramPhase.registrationValidation,
        accessToken,
      );
      await importRegistrations(programId, registrations, accessToken);

      await awaitChangePaStatus(
        programId,
        paymentReferenceIds,
        RegistrationStatusEnum.included,
        accessToken,
      );

      await doPayment(
        programId,
        payment1,
        amount,
        paymentReferenceIds,
        accessToken,
      );
      await waitForPaymentTransactionsToComplete(
        programId,
        paymentReferenceIds,
        accessToken,
        50000,
        ['success', 'waiting', 'error'],
        payment1,
      );
      await doPayment(
        programId,
        payment2,
        amount,
        paymentReferenceIds,
        accessToken,
      );
      await waitForPaymentTransactionsToComplete(
        programId,
        paymentReferenceIds,
        accessToken,
        50000,
        ['success', 'waiting', 'error'],
        payment2,
      );
    });

    it('should filter based on waiting payments', async () => {
      const filter = {};
      filter[`filter.${PaymentFilterEnum.waitingPayment}`] = payment1;
      // Act
      const getRegistrationsResponse = await getRegistrations(
        programId,
        null,
        accessToken,
        null,
        null,
        filter,
      );
      const data = getRegistrationsResponse.body.data;
      const meta = getRegistrationsResponse.body.meta;

      const expectedValueObjectWaiting = createExpectedValueObject(
        registration5,
        3,
      );
      // Assert
      for (const [key, value] of Object.entries(expectedValueObjectWaiting)) {
        expect(data[0][key]).toBe(value);
      }
      for (const attribute of expectedAttributes) {
        expect(data[0]).toHaveProperty(attribute);
      }
      expect(meta.totalItems).toBe(1);
    });

    it('should filter based on failed payments', async () => {
      const filter = {};
      filter[`filter.${PaymentFilterEnum.failedPayment}`] = payment1;
      // Act
      const getRegistrationsResponse = await getRegistrations(
        programId,
        null,
        accessToken,
        null,
        null,
        filter,
      );
      const data = getRegistrationsResponse.body.data;
      const meta = getRegistrationsResponse.body.meta;

      const expectedValueObjectFailed = createExpectedValueObject(
        registration3,
        2,
      );
      // Assert
      for (const [key, value] of Object.entries(expectedValueObjectFailed)) {
        expect(data[0][key]).toBe(value);
      }
      for (const attribute of expectedAttributes) {
        expect(data[0]).toHaveProperty(attribute);
      }
      expect(meta.totalItems).toBe(1);
    });

    it('should filter based on succes payments', async () => {
      const filter = {};
      filter[`filter.${PaymentFilterEnum.successPayment}`] = `$eq:${payment1}`;
      // Act
      const getRegistrationsResponse = await getRegistrations(
        programId,
        null,
        accessToken,
        null,
        null,
        filter,
      );
      const data = getRegistrationsResponse.body.data;
      const meta = getRegistrationsResponse.body.meta;

      const expectedValueObjectSucces1 = createExpectedValueObject(
        registration1,
        1,
      );
      const expectedValueObjectSucces4 = createExpectedValueObject(
        registration4,
        4,
      );
      // Assert
      for (const [key, value] of Object.entries(expectedValueObjectSucces1)) {
        expect(data[0][key]).toBe(value);
      }
      for (const attribute of expectedAttributes) {
        expect(data[0]).toHaveProperty(attribute);
      }
      for (const [key, value] of Object.entries(expectedValueObjectSucces4)) {
        expect(data[1][key]).toBe(value);
      }
      for (const attribute of expectedAttributes) {
        expect(data[1]).toHaveProperty(attribute);
      }
      expect(meta.totalItems).toBe(2);
    });

    it('should filter based on succes payments in combination with select and other filters', async () => {
      const filter = {};
      filter[`filter.${PaymentFilterEnum.successPayment}`] = `$eq:${payment1}`;
      filter['filter.lastName'] = registration1.lastName;
      filter['filter.phoneNumber'] = registration1.phoneNumber;
      // Act
      const getRegistrationsResponse = await getRegistrations(
        programId,
        ['referenceId', 'lastName'],
        accessToken,
        null,
        null,
        filter,
      );
      const data = getRegistrationsResponse.body.data;
      const meta = getRegistrationsResponse.body.meta;

      const expectedValueObjectSuccesSelect = {
        referenceId: registration1.referenceId,
        lastName: registration1.lastName,
      };
      const expectedAttributesSelect = ['referenceId', 'lastName'];
      // Assert
      for (const [key, value] of Object.entries(
        expectedValueObjectSuccesSelect,
      )) {
        expect(data[0][key]).toBe(value);
      }
      for (const attribute of expectedAttributesSelect) {
        expect(data[0]).toHaveProperty(attribute);
      }
      expect(meta.totalItems).toBe(1);
    });
  });
});
