/* eslint-disable jest/no-conditional-expect */
import { HttpStatus } from '@nestjs/common';

import { FspAttributes } from '@121-service/src/fsps/enums/fsp-attributes.enum';
import { ProjectRegistrationAttributeDto } from '@121-service/src/projects/dto/project-registration-attribute.dto';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { postProjectRegistrationAttribute } from '@121-service/test/helpers/project.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { projectIdPV } from '@121-service/test/registrations/pagination/pagination-data';

describe('Create project', () => {
  let accessToken: string;

  const projectRegistrationAttribute: ProjectRegistrationAttributeDto = {
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

  it('should post a project registration attribute', async () => {
    // Act
    const createReponse = await postProjectRegistrationAttribute(
      projectRegistrationAttribute,
      projectIdPV,
      accessToken,
    );
    // Assert
    expect(createReponse.statusCode).toBe(HttpStatus.CREATED);
  });

  it('should not be able to post a registration attributes with a name that already exists', async () => {
    // Arrange
    await postProjectRegistrationAttribute(
      projectRegistrationAttribute,
      projectIdPV,
      accessToken,
    );
    // Act
    const createReponse2 = await postProjectRegistrationAttribute(
      projectRegistrationAttribute as any,
      projectIdPV,
      accessToken,
    );
    // Assert
    expect(createReponse2.statusCode).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should not be able to post a registration attributes without obligatory attributes', async () => {
    // Arrange
    const requiredAttributes = ['name', 'type', 'label'];
    for (const attribute of requiredAttributes) {
      const projectRegistrationAttributeCopy = {
        ...projectRegistrationAttribute,
      };
      delete projectRegistrationAttributeCopy[attribute];

      const createResponse = await postProjectRegistrationAttribute(
        projectRegistrationAttributeCopy as any,
        projectIdPV,
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
      const projectRegistrationAttributeCopy = {
        ...projectRegistrationAttribute,
      };
      projectRegistrationAttributeCopy.name = name;

      // Act
      const createReponse = await postProjectRegistrationAttribute(
        projectRegistrationAttributeCopy,
        projectIdPV,
        accessToken,
      );
      // Assert
      expect(createReponse.statusCode).toBe(HttpStatus.BAD_REQUEST);
    }
  });
});
