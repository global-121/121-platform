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
  programIdOCW,
  programIdPV,
  registration1,
  registration3,
  registration4,
  registration5,
  registration6,
} from './pagination-data';

describe('Load PA table', () => {
  describe('getting registration using paginate and filtering on payment', () => {
    registration3.lastName = 'mock-fail-create-customer';
    // This number implies that in mock-service no incoming 'yes' is triggered, so that the transaction stays on 'waiting'
    registration5.whatsappPhoneNumber = '16005550002';

    let accessToken: string;
    const payment1 = 1;
    const payment2 = 2;
    const payment3 = 3;
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
        programIdOCW,
        ProgramPhase.registrationValidation,
        accessToken,
      );
      await importRegistrations(programIdOCW, registrations, accessToken);
      await importRegistrations(programIdPV, [registration6], accessToken);

      await awaitChangePaStatus(
        programIdOCW,
        paymentReferenceIds,
        RegistrationStatusEnum.included,
        accessToken,
      );

      await doPayment(
        programIdOCW,
        payment1,
        amount,
        paymentReferenceIds,
        accessToken,
      );
      await waitForPaymentTransactionsToComplete(
        programIdOCW,
        paymentReferenceIds,
        accessToken,
        50000,
        ['success', 'waiting', 'error'],
        payment1,
      );
      await doPayment(
        programIdOCW,
        payment2,
        amount,
        paymentReferenceIds,
        accessToken,
      );
      await waitForPaymentTransactionsToComplete(
        programIdOCW,
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
        programIdOCW,
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
      expect(data[0]).toMatchObject(expectedValueObjectWaiting);
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
        programIdOCW,
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
      expect(data[0]).toMatchObject(expectedValueObjectFailed);
      for (const attribute of expectedAttributes) {
        expect(data[0]).toHaveProperty(attribute);
      }
      expect(meta.totalItems).toBe(1);
    });

    it('should filter based on success payments', async () => {
      const filter = {};
      filter[`filter.${PaymentFilterEnum.successPayment}`] = `$eq:${payment1}`;
      // Act
      const getRegistrationsResponse = await getRegistrations(
        programIdOCW,
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
      expect(data[0]).toMatchObject(expectedValueObjectSucces1);
      for (const attribute of expectedAttributes) {
        expect(data[0]).toHaveProperty(attribute);
      }
      expect(data[1]).toMatchObject(expectedValueObjectSucces4);
      for (const attribute of expectedAttributes) {
        expect(data[1]).toHaveProperty(attribute);
      }
      expect(meta.totalItems).toBe(2);
    });

    it('should filter based on success payments in combination with select and other filters', async () => {
      const filter = {};
      filter[`filter.${PaymentFilterEnum.successPayment}`] = `$eq:${payment1}`;
      filter['filter.lastName'] = registration1.lastName;
      filter['filter.phoneNumber'] = registration1.phoneNumber;
      // Act
      const getRegistrationsResponse = await getRegistrations(
        programIdOCW,
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
      expect(data[0]).toMatchObject(expectedValueObjectSuccesSelect);
      for (const attribute of expectedAttributesSelect) {
        expect(data[0]).toHaveProperty(attribute);
      }
      expect(meta.totalItems).toBe(1);
    });

    it('should filter based on not yet sent payments', async () => {
      // do payment 3 for only 1 PA
      await doPayment(
        programIdOCW,
        payment3,
        amount,
        [paymentReferenceIds[0]],
        accessToken,
      );
      await waitForPaymentTransactionsToComplete(
        programIdOCW,
        [paymentReferenceIds[0]],
        accessToken,
        50000,
        ['success', 'waiting', 'error'],
        payment3,
      );

      // define filter as 'not yet sent payment #3'
      const filter = {};
      filter[
        `filter.${PaymentFilterEnum.notYetSentPayment}`
      ] = `$eq:${payment3}`;

      // Act
      const getRegistrationsResponse = await getRegistrations(
        programIdOCW,
        null,
        accessToken,
        null,
        null,
        filter,
      );
      const meta = getRegistrationsResponse.body.meta;

      // Test if filtered set is all - 1
      expect(meta.totalItems).toBe(paymentReferenceIds.length - 1);
    });
  });
});
