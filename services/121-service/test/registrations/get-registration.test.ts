import { FspName } from '../../src/fsp/enum/fsp-name.enum';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../src/shared/enum/program-phase.model';
import { changePhase } from '../helpers/program.helper';
import {
  getRegistrations,
  importRegistrations,
} from '../helpers/registration.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';

describe('Load PA table', () => {
  const programId = 3;
  const referenceId = '63e62864557597e0d';
  const registration = {
    referenceId: referenceId,
    preferredLanguage: 'en',
    paymentAmountMultiplier: 1,
    firstName: 'John',
    lastName: 'Smith',
    phoneNumber: '14155238886',
    fspName: FspName.intersolveJumboPhysical,
    whatsappPhoneNumber: '14155238886',
    addressStreet: 'Teststraat',
    addressHouseNumber: '1',
    addressHouseNumberAddition: '',
    addressPostalCode: '1234AB',
    addressCity: 'Stad',
  };

  const attribute1 = 'whatsappPhoneNumber';
  const attribute2 = 'addressCity';
  const attribute3 = 'referenceId';

  const exepectedAttributes = [
    'id',
    'status',
    'referenceId',
    'phoneNumber',
    'preferredLanguage',
    'inclusionScore',
    'paymentAmountMultiplier',
    'note',
    'noteUpdated',
    'financialServiceProvider',
    'registrationProgramId',
    'maxPayments',
    'lastTransactionCreated',
    'lastTransactionPaymentNumber',
    'lastTransactionStatus',
    'lastTransactionAmount',
    'lastTransactionErrorMessage',
    'lastTransactionCustomData',
    'amountPaymentsReceived',
    'importedDate',
    'invitedDate',
    'startedRegistrationDate',
    'registeredWhileNoLongerEligibleDate',
    'registeredDate',
    'rejectionDate',
    'noLongerEligibleDate',
    'validationDate',
    'inclusionDate',
    'inclusionEndDate',
    'selectedForValidationDate',
    'deleteDate',
    'completedDate',
    'lastMessageStatus',
    'lastMessageType',
  ];

  describe('getting registration using paginate', () => {
    let accessToken: string;

    beforeEach(async () => {
      await resetDB(SeedScript.nlrcMultiple);
      accessToken = await getAccessToken();

      await changePhase(
        programId,
        ProgramPhase.registrationValidation,
        accessToken,
      );

      await importRegistrations(programId, [registration], accessToken);
    });

    it('should return all dynamic attributes if param not supplied', async () => {
      // Arrange
      const requestedDynamicAttributes = null;
      const expectedValueObject = { ...registration };
      expectedValueObject['financialServiceProvider'] =
        expectedValueObject.fspName;
      delete expectedValueObject.fspName;

      // Act
      const getRegistrationsResponse = await getRegistrations(
        programId,
        requestedDynamicAttributes,
        accessToken,
      );
      const data = getRegistrationsResponse.body.data;
      const meta = getRegistrationsResponse.body.meta;
      // Assert
      for (const [key, value] of Object.entries(expectedValueObject)) {
        expect(data[0][key]).toBe(value);
      }
      for (const attribute of exepectedAttributes) {
        expect(data[0]).toHaveProperty(attribute);
      }
      expect(meta.totalItems).toBe(1);
    });

    it('should only return requested dynamic attributes if param-values supplied', async () => {
      // Arrange
      const requestedDynamicAttributes = [attribute1];

      // Act
      const getRegistrationsResponse = await getRegistrations(
        programId,
        requestedDynamicAttributes,
        accessToken,
      );
      const data = getRegistrationsResponse.body.data;

      // Assert
      expect(data[0]).toHaveProperty(attribute1);
      expect(data[0]).not.toHaveProperty(attribute2);
      expect(data[0]).not.toHaveProperty(attribute3);
    });

    it('Should return specified amount of PA per page', async () => {
      // Arrange
      const requestedDynamicAttributes = null;
      const programId2 = 2;

      // Act
      const getRegistrationsResponse = await getRegistrations(
        programId2,
        requestedDynamicAttributes,
        accessToken,
      );
      const data = getRegistrationsResponse.body.data;
      // Assert
      expect(data.length).toBe(0);
    });

    it('should be able to specify page attributes', async () => {
      // Arrange
      const registration1 = { ...registration };
      const registration2 = { ...registration };
      registration2.referenceId = '63e62864557597e0e';
      registration2.firstName = 'Anna';
      const requestedDynamicAttributes = null;
      const expectedValueObject1 = { ...registration1 };
      expectedValueObject1['financialServiceProvider'] =
        expectedValueObject1.fspName;
      delete expectedValueObject1.fspName;
      const expectedValueObject2 = { ...registration2 };
      expectedValueObject2['financialServiceProvider'] =
        expectedValueObject2.fspName;
      delete expectedValueObject2.fspName;
      await importRegistrations(programId, [registration2], accessToken);

      // Act
      const getRegistrationsResponse1 = await getRegistrations(
        programId,
        requestedDynamicAttributes,
        accessToken,
        1,
        1,
      );
      const data1 = getRegistrationsResponse1.body.data;
      const meta1 = getRegistrationsResponse1.body.meta;
      const getRegistrationsResponse2 = await getRegistrations(
        programId,
        requestedDynamicAttributes,
        accessToken,
        2,
        1,
      );
      const data2 = getRegistrationsResponse2.body.data;
      const meta2 = getRegistrationsResponse2.body.meta;

      const getRegistrationsResponseAll = await getRegistrations(
        programId,
        requestedDynamicAttributes,
        accessToken,
        1,
        2,
      );
      const dataAll = getRegistrationsResponseAll.body.data;
      const metaAll = getRegistrationsResponseAll.body.meta;

      // Assert

      // Registration 1
      for (const [key, value] of Object.entries(expectedValueObject1)) {
        expect(data1[0][key]).toBe(value);
      }
      for (const attribute of exepectedAttributes) {
        expect(data1[0]).toHaveProperty(attribute);
      }
      expect(meta1.currentPage).toBe(1);
      expect(meta1.itemsPerPage).toBe(1);
      expect(meta1.totalPages).toBe(2);
      expect(meta1.totalItems).toBe(2);

      // Registration 2
      for (const [key, value] of Object.entries(expectedValueObject2)) {
        expect(data2[0][key]).toBe(value);
      }
      for (const attribute of exepectedAttributes) {
        expect(data2[0]).toHaveProperty(attribute);
      }
      expect(meta2.currentPage).toBe(2);
      expect(meta2.itemsPerPage).toBe(1);
      expect(meta2.totalPages).toBe(2);
      expect(meta2.totalItems).toBe(2);

      // Registration All
      expect(metaAll.currentPage).toBe(1);
      expect(metaAll.itemsPerPage).toBe(2);
      expect(metaAll.totalPages).toBe(1);
      expect(metaAll.totalItems).toBe(2);
      expect(dataAll.length).toBe(2);
    });
  });
});
