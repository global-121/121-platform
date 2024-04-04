/* eslint-disable jest/no-conditional-expect */
import { HttpStatus } from '@nestjs/common';
import { SeedScript } from '../../../src/scripts/seed-script.enum';
import { postCustomAttribute } from '../helpers/program.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';
import { programIdPV } from '../registrations/pagination/pagination-data';

describe('Create program custom attributes', () => {
  let accessToken: string;

  const customAttribute = {
    name: 'district',
    type: 'text',
    label: {
      en: 'District',
      fr: 'Département',
    },
    phases: ['registrationValidation', 'inclusion', 'payment'],
    duplicateCheck: true,
  };

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
  });

  it('should post a program attributes', async () => {
    // Act
    const createReponse = await postCustomAttribute(
      customAttribute as any,
      programIdPV,
      accessToken,
    );

    // Assert
    expect(createReponse.statusCode).toBe(HttpStatus.CREATED);
  });

  it('should no be able to post a attribute with a name that already exists', async () => {
    // Arrange
    await postCustomAttribute(customAttribute as any, programIdPV, accessToken);
    // Act
    const createReponse2 = await postCustomAttribute(
      customAttribute as any,
      programIdPV,
      accessToken,
    );
    // Assert
    expect(createReponse2.statusCode).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should no be able to post a attribute without obligatory attributes', async () => {
    // Arrange
    const requiredAttributes = ['name', 'type', 'label'];
    for (const attribute of requiredAttributes) {
      const programAttributeCopy = { ...customAttribute };
      delete programAttributeCopy[attribute];

      const createReponse = await postCustomAttribute(
        programAttributeCopy as any,
        programIdPV,
        accessToken,
      );
      // Assert
      expect(createReponse.statusCode).toBe(HttpStatus.BAD_REQUEST);
    }
  });

  it('should no be able to post a attribute with a fsp/program question that exists', async () => {
    // Arrange
    const names = ['fullName', 'whatsappPhoneNumber'];
    for (const name of names) {
      const programAttributeCopy = { ...customAttribute };
      programAttributeCopy.name = name;

      // Act
      const createReponse = await postCustomAttribute(
        programAttributeCopy as any,
        programIdPV,
        accessToken,
      );
      // Assert
      expect(createReponse.statusCode).toBe(HttpStatus.BAD_REQUEST);
    }
  });
});
