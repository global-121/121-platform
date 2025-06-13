import { FinancialServiceProviders } from '@121-service/src/fsps/enums/fsp-name.enum';
import { GenericRegistrationAttributes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { getProgram } from '@121-service/test/helpers/program.helper';
import {
  awaitChangeRegistrationStatus,
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
  registrationOCW1,
  registrationOCW2,
  registrationOCW3,
  registrationOCW4,
  registrationOCW5,
} from '@121-service/test/registrations/pagination/pagination-data';

const registrations = [
  registrationOCW1,
  registrationOCW2,
  registrationOCW3,
  registrationOCW4,
  registrationOCW5,
];
const allReferenceIds = registrations.map(
  (registration) => registration.referenceId,
);

describe('Load PA table', () => {
  describe('getting registration using paginate', () => {
    let accessToken: string;

    beforeAll(async () => {
      await resetDB(SeedScript.nlrcMultiple);
      accessToken = await getAccessToken();

      await importRegistrations(programIdOCW, registrations, accessToken);

      await awaitChangeRegistrationStatus({
        programId: programIdOCW,
        referenceIds: [registrationOCW2.referenceId],
        status: RegistrationStatusEnum.included,
        accessToken,
      });
    });

    it('should filter based on status', async () => {
      // Act
      const getRegistrationsResponse = await getRegistrations({
        programId: programIdOCW,
        accessToken,
        filter: { 'filter.status': RegistrationStatusEnum.included },
      });
      const data = getRegistrationsResponse.body.data;
      const meta = getRegistrationsResponse.body.meta;

      // Assert
      expect(data[0]).toMatchObject(
        createExpectedValueObject(registrationOCW2, 2),
      );
      for (const attribute of expectedAttributes) {
        expect(data[0]).toHaveProperty(attribute);
      }
      expect(meta.totalItems).toBe(1);
    });

    it('should filter based on registration data', async () => {
      // Act
      const getRegistrationsResponse = await getRegistrations({
        programId: programIdOCW,
        accessToken,
        filter: {
          'filter.whatsappPhoneNumber': registrationOCW4.whatsappPhoneNumber,
        },
      });
      const data = getRegistrationsResponse.body.data;
      const meta = getRegistrationsResponse.body.meta;

      // Assert
      expect(data[0]).toMatchObject(
        createExpectedValueObject(registrationOCW4, 4),
      );
      for (const attribute of expectedAttributes) {
        expect(data[0]).toHaveProperty(attribute);
      }
      expect(meta.totalItems).toBe(1);
    });

    it('should filter based on root attributes', async () => {
      const filterAssertionConfig: Partial<
        Record<
          GenericRegistrationAttributes,
          {
            filterValue: string;
            expectedReferenceIds: string[];
          }
        >
      > = {
        referenceId: {
          filterValue: '63e6286',
          expectedReferenceIds: [registrationOCW1.referenceId],
        },
        phoneNumber: {
          filterValue: '14155235555',
          expectedReferenceIds: [registrationOCW4.referenceId],
        },
        preferredLanguage: {
          filterValue: LanguageEnum.en,
          expectedReferenceIds: [
            registrationOCW1.referenceId,
            registrationOCW2.referenceId,
          ],
        },
        inclusionScore: {
          filterValue: '',
          expectedReferenceIds: allReferenceIds,
        },
        paymentAmountMultiplier: {
          filterValue: '1',
          expectedReferenceIds: allReferenceIds,
        },
        programFinancialServiceProviderConfigurationName: {
          filterValue: FinancialServiceProviders.intersolveVoucherWhatsapp,
          expectedReferenceIds: [registrationOCW5.referenceId],
        },
      };

      const program = await getProgram(programIdOCW, accessToken);
      const filterablePaAttributes = program.body.filterableAttributes.find(
        (attribute) => attribute.group === 'paAttributes',
      );
      const genericFilterableAttributes = filterablePaAttributes.filters.filter(
        (attribute) => GenericRegistrationAttributes[attribute.name],
      );
      for (const attribute of genericFilterableAttributes) {
        if (!filterAssertionConfig[attribute.name]) {
          throw new Error(
            `No filterAssertionConfig found for attribute: ${attribute.name}`,
          );
        }

        const filterValue = filterAssertionConfig[attribute.name]?.filterValue;

        const filter = {
          [`filter.${attribute.name}`]: `$ilike:${filterValue}`,
        };

        // Act
        const getRegistrationsResponse = await getRegistrations({
          programId: programIdOCW,
          accessToken,
          filter,
        });
        const data = getRegistrationsResponse.body.data;
        const foundReferenceIds = data.map(
          (registration) => registration.referenceId,
        );

        // Assert
        // The referenceId are compared with the attribute name attached to it
        // This way you can more easily find for which attribute the test failed
        const foundValidatationObject = {
          [attribute.name]: foundReferenceIds.sort(),
        };
        const expectedValidationObject = {
          [attribute.name]:
            filterAssertionConfig[attribute.name]?.expectedReferenceIds.sort(),
        };
        expect(foundValidatationObject).toEqual(expectedValidationObject);
      }
    });

    it('should filter using in, eq, ilike and null', async () => {
      // Act
      // Each of the filters would seperately return
      const getRegistrationsResponse = await getRegistrations({
        programId: programIdOCW,
        accessToken,
        filter: {
          'filter.whatsappPhoneNumber': `$ilike:${registrationOCW3.whatsappPhoneNumber.substring(
            0,
            1,
          )}`,
          'filter.preferredLanguage': `$in:nonExisting,${registrationOCW3.preferredLanguage}`,
          'filter.addressCity': `$eq:${registrationOCW3.addressCity}`,
        },
      });
      const data = getRegistrationsResponse.body.data;
      const meta = getRegistrationsResponse.body.meta;

      // Assert
      expect(data[0]).toMatchObject(
        createExpectedValueObject(registrationOCW3, 3),
      );
      for (const attribute of expectedAttributes) {
        expect(data[0]).toHaveProperty(attribute);
      }
      expect(meta.totalItems).toBe(1);
    });

    it('should filter using search in combination with filter', async () => {
      // Act
      // The postal code shoud filter 1 and 2 and the search should filter 2 and 4, so only 2 should be returned
      const getRegistrationsResponse = await getRegistrations({
        programId: programIdOCW,
        accessToken,
        filter: {
          'filter.addressPostalCode': `$ilike:${registrationOCW2.addressPostalCode.substring(
            0,
            1,
          )}`,
          search: `${registrationOCW2.addressCity}`,
        },
      });
      const data = getRegistrationsResponse.body.data;
      const meta = getRegistrationsResponse.body.meta;

      // Assert
      expect(data[0]).toMatchObject(
        createExpectedValueObject(registrationOCW2, 2),
      );
      for (const attribute of expectedAttributes) {
        expect(data[0]).toHaveProperty(attribute);
      }
      expect(meta.totalItems).toBe(1);
    });
  });
});
