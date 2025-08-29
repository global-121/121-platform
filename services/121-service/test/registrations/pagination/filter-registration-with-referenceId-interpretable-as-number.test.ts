import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getRegistrations,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  projectIdOCW,
  registrationOCW1,
  registrationOCW2,
  registrationOCW3,
  registrationOCW4,
} from '@121-service/test/registrations/pagination/pagination-data';

const referenceIdInterpretableAsNumber = '651581942751358e5'; // A just-number string like '1234567890' is somehow not sufficiently covering the edge case, as this would not lead to the same bug prior to bugfix AB#30713

describe('Load PA table', () => {
  describe('getting registration with referenceId interpretable as number using paginate', () => {
    let accessToken: string;

    beforeAll(async () => {
      await resetDB(SeedScript.nlrcMultiple, __filename);
      accessToken = await getAccessToken();

      const registrationWithReferenceIdInterpretableAsNumber =
        structuredClone(registrationOCW1);
      registrationWithReferenceIdInterpretableAsNumber.referenceId =
        referenceIdInterpretableAsNumber;

      await importRegistrations(
        projectIdOCW,
        [
          registrationOCW1,
          registrationOCW2,
          registrationOCW3,
          registrationOCW4,
          registrationWithReferenceIdInterpretableAsNumber,
        ],
        accessToken,
      );
    });

    it('should filter using a referenceId string', async () => {
      // Act
      const getRegistrationsResponse = await getRegistrations({
        projectId: projectIdOCW,
        accessToken,
        filter: {
          'filter.referenceId': referenceIdInterpretableAsNumber,
        },
      });
      const meta = getRegistrationsResponse.body.meta;

      // Assert
      expect(getRegistrationsResponse.status).toBe(200);
      expect(meta.totalItems).toBe(1);
    });

    it('should filter with $eq', async () => {
      // Act
      const getRegistrationsResponse = await getRegistrations({
        projectId: projectIdOCW,
        accessToken,
        filter: {
          'filter.referenceId': `$eq:${referenceIdInterpretableAsNumber}`,
        },
      });
      const meta = getRegistrationsResponse.body.meta;

      // Assert
      expect(getRegistrationsResponse.status).toBe(200);
      expect(meta.totalItems).toBe(1);
    });

    it('should filter with $ilike', async () => {
      // Act
      const getRegistrationsResponse = await getRegistrations({
        projectId: projectIdOCW,
        accessToken,
        filter: {
          'filter.referenceId': `$ilike:${referenceIdInterpretableAsNumber}`,
        },
      });
      const meta = getRegistrationsResponse.body.meta;

      // Assert
      expect(getRegistrationsResponse.status).toBe(200);
      expect(meta.totalItems).toBe(1);
    });

    it('should filter with $in', async () => {
      // Act
      const getRegistrationsResponse = await getRegistrations({
        projectId: projectIdOCW,
        accessToken,
        filter: {
          'filter.referenceId': `$in:${referenceIdInterpretableAsNumber}`,
        },
      });
      const meta = getRegistrationsResponse.body.meta;

      // Assert
      expect(getRegistrationsResponse.status).toBe(200);
      expect(meta.totalItems).toBe(1);
    });
  });
});
