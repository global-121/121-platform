import { PaymentFilterEnum } from '@121-service/src/registration/enum/payment-filter.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';
import {
  doPayment,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  awaitChangePaStatus,
  getRegistrations,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  createExpectedValueObject,
  expectedAttributes,
  programIdOCW,
  programIdPV,
  registrationOCW2,
  registrationOCW3,
  registrationOCW4,
  registrationOCW5,
  registrationPV6,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Load PA table', () => {
  describe('getting registration using paginate and filtering on payment', () => {
    registrationOCW3.fullName = 'mock-fail-create-customer';
    // This number implies that in mock-service no incoming 'yes' is triggered, so that the transaction stays on 'waiting'
    registrationOCW5.whatsappPhoneNumber = '16005550002';

    let accessToken: string;
    const payment1 = 1;
    const payment2 = 2;
    const payment3 = 3;
    const amount = 10;
    const registrations = [
      registrationOCW2,
      registrationOCW3,
      registrationOCW5,
      registrationOCW4,
    ];
    const paymentReferenceIds = registrations.map(
      (registration) => registration.referenceId,
    );

    beforeAll(async () => {
      await resetDB(SeedScript.nlrcMultiple);
      accessToken = await getAccessToken();

      await importRegistrations(programIdOCW, registrations, accessToken);
      await importRegistrations(programIdPV, [registrationPV6], accessToken);

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
        50_000,
        [StatusEnum.success, StatusEnum.waiting, StatusEnum.error],
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
        50_000,
        [StatusEnum.success, StatusEnum.waiting, StatusEnum.error],
        payment2,
      );
    });

    it('should filter based on waiting payments', async () => {
      // Arrange

      // Act
      const filter = {
        [`filter.${PaymentFilterEnum.waitingPayment}`]: `${payment1}`,
      };
      const getRegistrationsResponse = await getRegistrations({
        programId: programIdOCW,
        accessToken,
        filter,
      });
      const data = getRegistrationsResponse.body.data;
      const meta = getRegistrationsResponse.body.meta;

      // Assert
      const expectedValueObjectWaiting = createExpectedValueObject(
        registrationOCW5,
        3,
      );

      expect(data[0]).toMatchObject(expectedValueObjectWaiting);
      for (const attribute of expectedAttributes) {
        expect(data[0]).toHaveProperty(attribute);
      }
      expect(meta.totalItems).toBe(1);
    });

    it('should filter based on failed payments', async () => {
      // Arrange

      // Act
      const filter = {
        [`filter.${PaymentFilterEnum.failedPayment}`]: `${payment1}`,
      };
      const getRegistrationsResponse = await getRegistrations({
        programId: programIdOCW,
        accessToken,
        filter,
      });
      const data = getRegistrationsResponse.body.data;
      const meta = getRegistrationsResponse.body.meta;

      // Assert
      const expectedValueObjectFailed = createExpectedValueObject(
        registrationOCW3,
        2,
      );

      expect(data[0]).toMatchObject(expectedValueObjectFailed);
      for (const attribute of expectedAttributes) {
        expect(data[0]).toHaveProperty(attribute);
      }
      expect(meta.totalItems).toBe(1);
    });

    it('should filter based on success payments', async () => {
      // Arrange

      // Act
      const filter = {
        [`filter.${PaymentFilterEnum.successPayment}`]: `$eq:${payment1}`,
      };
      const getRegistrationsResponse = await getRegistrations({
        programId: programIdOCW,
        accessToken,
        filter,
      });
      const data = getRegistrationsResponse.body.data;
      const meta = getRegistrationsResponse.body.meta;

      // Assert
      const expectedValueObjectSucces1 = createExpectedValueObject(
        registrationOCW2,
        1,
      );
      const expectedValueObjectSucces4 = createExpectedValueObject(
        registrationOCW4,
        4,
      );

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
      // Arrange

      // Act
      const filter = {
        [`filter.${PaymentFilterEnum.successPayment}`]: `$eq:${payment1}`,
        ['filter.fullName']: registrationOCW2.fullName,
        ['filter.phoneNumber']: registrationOCW2.phoneNumber,
      };
      const getRegistrationsResponse = await getRegistrations({
        programId: programIdOCW,
        attributes: ['referenceId', 'fullName'],
        accessToken,
        filter,
      });
      const data = getRegistrationsResponse.body.data;
      const meta = getRegistrationsResponse.body.meta;

      // Assert
      const expectedValueObjectSuccesSelect = {
        referenceId: registrationOCW2.referenceId,
        fullName: registrationOCW2.fullName,
      };
      const expectedAttributesSelect = ['referenceId', 'fullName'];
      expect(data[0]).toMatchObject(expectedValueObjectSuccesSelect);
      for (const attribute of expectedAttributesSelect) {
        expect(data[0]).toHaveProperty(attribute);
      }
      expect(meta.totalItems).toBe(1);
    });

    it('should filter based on not yet sent payments', async () => {
      // Arrange
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
        50_000,
        [StatusEnum.success, StatusEnum.waiting, StatusEnum.error],
        payment3,
      );

      // Act
      const filter = {
        [`filter.${PaymentFilterEnum.notYetSentPayment}`]: `$eq:${payment3}`,
      };

      const getRegistrationsResponse = await getRegistrations({
        programId: programIdOCW,
        accessToken,
        filter,
      });
      const meta = getRegistrationsResponse.body.meta;

      // Assert
      expect(meta.totalItems).toBe(paymentReferenceIds.length - 1);
    });
  });
});
