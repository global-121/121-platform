import { HttpStatus } from '@nestjs/common';

import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import { CreateProgramDto } from '@121-service/src/programs/dto/create-program.dto';
import { CreateProgramRegistrationAttributeDto } from '@121-service/src/programs/dto/program-registration-attribute.dto';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getProgram,
  patchProgramRegistrationAttribute,
  postProgram,
  postProgramRegistrationAttribute,
  updateProgramAccessGroupLevels,
} from '@121-service/test/helpers/program.helper';
import {
    getAccessToken,
    resetDB,
} from '@121-service/test/helpers/utility.helper';

const createTextAttribute = ({
  name,
}: {
  name: string;
}): CreateProgramRegistrationAttributeDto => ({
  name,
  type: RegistrationAttributeTypes.text,
  label: { en: name },
});

describe('Get program', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB({ seedScript: SeedScript.nlrcMultiple });
    accessToken = await getAccessToken();
  });

  describe('programRegistrationAttributes order', () => {
    // Names are deliberately not alphabetical, so the expected order can only come from created + id
    const attributeNamesCreatedWithProgram = ['zebra', 'apple', 'mango'];
    const attributeNameCreatedAfterProgram = 'banana';
    const expectedAttributeNames = [
      ...attributeNamesCreatedWithProgram,
      attributeNameCreatedAfterProgram,
    ];

    const getTestAttributeNames = async ({
      programId,
    }: {
      programId: number;
    }): Promise<string[]> => {
      const getProgramResponse = await getProgram(programId, accessToken);
      expect(getProgramResponse.statusCode).toBe(HttpStatus.OK);

      return getProgramResponse.body.programRegistrationAttributes
        .map((attribute: { name: string }) => attribute.name)
        .filter((name: string) => expectedAttributeNames.includes(name));
    };

    const createProgramWithAttributes = async (): Promise<number> => {
      const program: CreateProgramDto = {
        titlePortal: { en: 'Program for attribute order' },
        currency: CurrencyCode.EUR,
        programRegistrationAttributes: attributeNamesCreatedWithProgram.map(
          (name) => createTextAttribute({ name }),
        ),
      };
      const createProgramResponse = await postProgram(program, accessToken);
      expect(createProgramResponse.statusCode).toBe(HttpStatus.CREATED);

      return createProgramResponse.body.id;
    };

    it('should return attributes ordered by created and then id', async () => {
      // Arrange
      // Attributes created together with the program share one `created` timestamp, so id breaks the tie
      const programId = await createProgramWithAttributes();
      const postAttributeResponse = await postProgramRegistrationAttribute(
        createTextAttribute({ name: attributeNameCreatedAfterProgram }),
        programId,
        accessToken,
      );
      expect(postAttributeResponse.statusCode).toBe(HttpStatus.CREATED);

      // Act
      const attributeNames = await getTestAttributeNames({ programId });

      // Assert
      expect(attributeNames).toEqual(expectedAttributeNames);
    });

    it('should keep the order of attributes after updating an attribute', async () => {
      // Arrange
      const programId = await createProgramWithAttributes();
      await postProgramRegistrationAttribute(
        createTextAttribute({ name: attributeNameCreatedAfterProgram }),
        programId,
        accessToken,
      );

      // Act
      const patchAttributeResponse = await patchProgramRegistrationAttribute({
        programRegistrationAttributeName: attributeNamesCreatedWithProgram[0],
        programRegistrationAttribute: { label: { en: 'updated label' } },
        programId,
        accessToken,
      });
      const attributeNames = await getTestAttributeNames({ programId });

      // Assert
      expect(patchAttributeResponse.statusCode).toBe(HttpStatus.OK);
      expect(attributeNames).toEqual(expectedAttributeNames);
    });
  });

  describe('accessGroupRegistrationAttributeNames', () => {
    const programId = 1;

    it('should return empty array when no access group levels are configured', async () => {
      // Act
      const getProgramResponse = await getProgram(programId, accessToken);

      // Assert
      expect(getProgramResponse.statusCode).toBe(HttpStatus.OK);
      expect(
        getProgramResponse.body.accessGroupRegistrationAttributeNames,
      ).toEqual([]);
    });

    it('should return configured access group level attribute names in order', async () => {
      // Arrange
      const provinceAttribute: CreateProgramRegistrationAttributeDto = {
        name: 'province',
        type: RegistrationAttributeTypes.dropdown,
        label: { en: 'Province' },
        options: [{ option: 'utrecht', label: { en: 'Utrecht' } }],
      };
      await postProgramRegistrationAttribute(
        provinceAttribute,
        programId,
        accessToken,
      );
      await updateProgramAccessGroupLevels(
        programId,
        { accessGroupRegistrationAttributeNames: ['province'] },
        accessToken,
      );

      // Act
      const getProgramResponse = await getProgram(programId, accessToken);

      // Assert
      expect(
        getProgramResponse.body.accessGroupRegistrationAttributeNames,
      ).toEqual(['province']);
    });
  });
});
