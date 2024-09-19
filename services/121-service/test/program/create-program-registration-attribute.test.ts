/* eslint-disable jest/no-conditional-expect */
import { HttpStatus } from '@nestjs/common';

import { ExportType } from '@121-service/src/metrics/dto/export-details.dto';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { postProgramRegistrationAttribute } from '@121-service/test/helpers/program.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { programIdPV } from '@121-service/test/registrations/pagination/pagination-data';

describe('Create program', () => {
  let accessToken: string;

  const programRegistrationAttribute = {
    name: 'string',
    options: {},
    scoring: {},
    persistence: true,
    pattern: 'string',
    showInPeopleAffectedTable: true,
    editableInPortal: true,
    export: [ExportType.allPeopleAffected, ExportType.included],
    label: {
      en: 'Last Name',
    },
    placeholder: {
      en: '+31 6 00 00 00 00',
    },
    duplicateCheck: false,
    type: 'text',
    isRequired: false,
  };

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
  });

  it('should post a program registration attribute', async () => {
    // Act
    const createReponse = await postProgramRegistrationAttribute(
      programRegistrationAttribute as any,
      programIdPV,
      accessToken,
    );

    // Assert
    expect(createReponse.statusCode).toBe(HttpStatus.CREATED);
  });

  it('should not be able to post a registration attributes with a name that already exists', async () => {
    // Arrange
    await postProgramRegistrationAttribute(
      programRegistrationAttribute as any,
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
      const programCustomAttributeCopy = { ...programRegistrationAttribute };
      delete programCustomAttributeCopy[attribute];

      const createReponse = await postProgramRegistrationAttribute(
        programCustomAttributeCopy as any,
        programIdPV,
        accessToken,
      );
      // Assert
      expect(createReponse.statusCode).toBe(HttpStatus.BAD_REQUEST);
    }
  });

  it('should not be able to post a registration attributes with an attribute name that exists', async () => {
    // Arrange
    const names = ['namePartnerOrganization', 'whatsappPhoneNumber'];
    for (const name of names) {
      const programCustomAttributeCopy = { ...programRegistrationAttribute };
      programCustomAttributeCopy.name = name;

      // Act
      const createReponse = await postProgramRegistrationAttribute(
        programCustomAttributeCopy as any,
        programIdPV,
        accessToken,
      );
      // Assert
      expect(createReponse.statusCode).toBe(HttpStatus.BAD_REQUEST);
    }
  });
});
