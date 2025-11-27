import { HttpStatus } from '@nestjs/common';

import { FspAttributes } from '@121-service/src/fsps/enums/fsp-attributes.enum';
import { ProgramRegistrationAttributeDto } from '@121-service/src/programs/dto/program-registration-attribute.dto';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { postProgramRegistrationAttribute } from '@121-service/test/helpers/program.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { programIdPV } from '@121-service/test/registrations/pagination/pagination-data';

describe('Create program', () => {
  let accessToken: string;

  const programRegistrationAttribute: ProgramRegistrationAttributeDto = {
    name: 'string',
    options: [],
    scoring: {},
    pattern: 'string',
    showInPeopleAffectedTable: true,
    editableInPortal: true,
    includeInTransactionExport: true,
    label: {
      en: 'Last Name',
    },
    placeholder: {
      en: '+31 6 00 00 00 00',
    },
    duplicateCheck: false,
    type: RegistrationAttributeTypes.text,
    isRequired: false,
  };

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
  });

  it('should post a program registration attribute', async () => {
    // Act
    const createReponse = await postProgramRegistrationAttribute(
      programRegistrationAttribute,
      programIdPV,
      accessToken,
    );
    // Assert
    expect(createReponse.statusCode).toBe(HttpStatus.CREATED);
  });

  it('should not be able to post a registration attributes with a name that already exists', async () => {
    // Arrange
    await postProgramRegistrationAttribute(
      programRegistrationAttribute,
      programIdPV,
      accessToken,
    );
    // Act
    const createReponse2 = await postProgramRegistrationAttribute(
      programRegistrationAttribute as any,
      programIdPV,
      accessToken,
    );
    // Assert
    expect(createReponse2.statusCode).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should not be able to post a registration attributes without obligatory attributes', async () => {
    // Arrange
    const requiredAttributes = ['name', 'type', 'label'];
    for (const attribute of requiredAttributes) {
      const programRegistrationAttributeCopy = {
        ...programRegistrationAttribute,
      };
      delete programRegistrationAttributeCopy[attribute];

      const createResponse = await postProgramRegistrationAttribute(
        programRegistrationAttributeCopy as any,
        programIdPV,
        accessToken,
      );
      // Assert
      expect(createResponse.statusCode).toBe(HttpStatus.BAD_REQUEST);
    }
  });

  it('should not be able to post a registration attributes with an attribute name that exists', async () => {
    // Arrange
    const names = [
      'namePartnerOrganization',
      FspAttributes.whatsappPhoneNumber,
    ];
    for (const name of names) {
      const programRegistrationAttributeCopy = {
        ...programRegistrationAttribute,
      };
      programRegistrationAttributeCopy.name = name;

      // Act
      const createReponse = await postProgramRegistrationAttribute(
        programRegistrationAttributeCopy,
        programIdPV,
        accessToken,
      );
      // Assert
      expect(createReponse.statusCode).toBe(HttpStatus.BAD_REQUEST);
    }
  });
});
