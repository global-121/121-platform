import { HttpStatus } from '@nestjs/common';

import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import { UpdateProgramAccessGroupLevelsDto } from '@121-service/src/programs/access-group-levels/dtos/update-program-access-group-levels.dto';
import { CreateProgramDto } from '@121-service/src/programs/dto/create-program.dto';
import { CreateProgramRegistrationAttributeDto } from '@121-service/src/programs/dto/program-registration-attribute.dto';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { DefaultUserRole } from '@121-service/src/user/enum/user-role.enum';
import {
  getProgramAccessGroupLevels,
  postProgram,
  postProgramRegistrationAttribute,
  updateProgramAccessGroupLevels,
} from '@121-service/test/helpers/program.helper';
import { uploadAttachment } from '@121-service/test/helpers/program-attachments.helper';
import {
  createUserProgramAssignment,
  getAllUsers,
} from '@121-service/test/helpers/user.helper';
import {
  assignUserToProgram,
  createUserAssignedToProgram,
  getAccessToken,
  getAccessTokenScoped,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

const testImagePath = './test-attachment-data/sample.jpg';

// A minimal program the tests build on.
const baseProgram: CreateProgramDto = {
  titlePortal: { en: 'Access group levels test program' },
  currency: CurrencyCode.EUR,
  languages: [RegistrationPreferredLanguage.en],
};

describe('Update program access group levels', () => {
  let accessToken: string;

  beforeAll(async () => {
    await resetDB({ seedScript: SeedScript.nlrcMultiple });
    accessToken = await getAccessToken();
  });

  it('should replace the access group level registration attributes', async () => {
    // Arrange
    const createProgramResponse = await postProgram(baseProgram, accessToken);
    const programId = createProgramResponse.body.id;
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

    const updateProgramAccessGroupLevelsDto: UpdateProgramAccessGroupLevelsDto =
      {
        accessGroupRegistrationAttributeNames: ['province'],
      };

    // Act
    const response = await updateProgramAccessGroupLevels(
      programId,
      updateProgramAccessGroupLevelsDto,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body).toStrictEqual({
      accessGroupRegistrationAttributeNames:
        updateProgramAccessGroupLevelsDto.accessGroupRegistrationAttributeNames,
    });
  });

  it('should replace, not merge with, previously configured access group levels', async () => {
    // Arrange
    const createProgramResponse = await postProgram(baseProgram, accessToken);
    const programId = createProgramResponse.body.id;
    const provinceAttribute: CreateProgramRegistrationAttributeDto = {
      name: 'province',
      type: RegistrationAttributeTypes.dropdown,
      label: { en: 'Province' },
      options: [{ option: 'utrecht', label: { en: 'Utrecht' } }],
    };
    const districtAttribute: CreateProgramRegistrationAttributeDto = {
      name: 'district',
      type: RegistrationAttributeTypes.dropdown,
      label: { en: 'District' },
      options: [{ option: 'houten', label: { en: 'Houten' } }],
    };
    await postProgramRegistrationAttribute(
      provinceAttribute,
      programId,
      accessToken,
    );
    await postProgramRegistrationAttribute(
      districtAttribute,
      programId,
      accessToken,
    );
    await updateProgramAccessGroupLevels(
      programId,
      { accessGroupRegistrationAttributeNames: ['province'] },
      accessToken,
    );

    const updateProgramAccessGroupLevelsDto: UpdateProgramAccessGroupLevelsDto =
      {
        accessGroupRegistrationAttributeNames: ['district'],
      };

    // Act
    const response = await updateProgramAccessGroupLevels(
      programId,
      updateProgramAccessGroupLevelsDto,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body).toStrictEqual({
      accessGroupRegistrationAttributeNames: ['district'],
    });
    const accessGroupLevels = await getProgramAccessGroupLevels(
      programId,
      accessToken,
    );
    expect(accessGroupLevels.body).toStrictEqual({
      accessGroupRegistrationAttributeNames: ['district'],
    });
  });

  it('should clear the access group levels when an empty array is sent', async () => {
    // Arrange
    const createProgramResponse = await postProgram(baseProgram, accessToken);
    const programId = createProgramResponse.body.id;
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
    const response = await updateProgramAccessGroupLevels(
      programId,
      { accessGroupRegistrationAttributeNames: [] },
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body).toStrictEqual({
      accessGroupRegistrationAttributeNames: [],
    });
    const accessGroupLevels = await getProgramAccessGroupLevels(
      programId,
      accessToken,
    );
    expect(accessGroupLevels.body).toStrictEqual({
      accessGroupRegistrationAttributeNames: [],
    });
  });

  it('should not allow replacing an access group level that is assigned to a user', async () => {
    // Arrange
    const createProgramResponse = await postProgram(baseProgram, accessToken);
    const programId = createProgramResponse.body.id;
    const provinceAttribute: CreateProgramRegistrationAttributeDto = {
      name: 'province',
      type: RegistrationAttributeTypes.dropdown,
      label: { en: 'Province' },
      options: [{ option: 'utrecht', label: { en: 'Utrecht' } }],
    };
    const districtAttribute: CreateProgramRegistrationAttributeDto = {
      name: 'district',
      type: RegistrationAttributeTypes.dropdown,
      label: { en: 'District' },
      options: [{ option: 'houten', label: { en: 'Houten' } }],
    };
    await postProgramRegistrationAttribute(
      provinceAttribute,
      programId,
      accessToken,
    );
    await postProgramRegistrationAttribute(
      districtAttribute,
      programId,
      accessToken,
    );
    await updateProgramAccessGroupLevels(
      programId,
      { accessGroupRegistrationAttributeNames: ['province'] },
      accessToken,
    );

    const userId = await createUserAssignedToProgram({
      programId,
      roles: [DefaultUserRole.View],
      adminAccessToken: accessToken,
    });
    await createUserProgramAssignment({
      programId,
      userId,
      roles: [DefaultUserRole.View],
      accessGroups: [
        {
          programRegistrationAttributeName: 'province',
          value: 'utrecht',
        },
      ],
      accessToken,
    });

    // Act
    const response = await updateProgramAccessGroupLevels(
      programId,
      { accessGroupRegistrationAttributeNames: ['district'] },
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    const accessGroupLevels = await getProgramAccessGroupLevels(
      programId,
      accessToken,
    );
    expect(accessGroupLevels.body).toStrictEqual({
      accessGroupRegistrationAttributeNames: ['province'],
    });
  });

  it('should not allow replacing an access group level that is used by an attachment', async () => {
    // Arrange
    const createProgramResponse = await postProgram(baseProgram, accessToken);
    const programId = createProgramResponse.body.id;
    const provinceAttribute: CreateProgramRegistrationAttributeDto = {
      name: 'province',
      type: RegistrationAttributeTypes.dropdown,
      label: { en: 'Province' },
      options: [{ option: 'utrecht', label: { en: 'Utrecht' } }],
    };
    const districtAttribute: CreateProgramRegistrationAttributeDto = {
      name: 'district',
      type: RegistrationAttributeTypes.dropdown,
      label: { en: 'District' },
      options: [{ option: 'houten', label: { en: 'Houten' } }],
    };
    await postProgramRegistrationAttribute(
      provinceAttribute,
      programId,
      accessToken,
    );
    await postProgramRegistrationAttribute(
      districtAttribute,
      programId,
      accessToken,
    );
    await updateProgramAccessGroupLevels(
      programId,
      { accessGroupRegistrationAttributeNames: ['province'] },
      accessToken,
    );

    const allUsersResponse = await getAllUsers(accessToken);
    const users = allUsersResponse.body as { id: number; username: string }[];
    const uploaderUserId = users.find(
      ({ username }) => username === `${DebugScope.Kisumu}@example.org`,
    )!.id;
    await assignUserToProgram({
      programId,
      userId: uploaderUserId,
      roles: [DefaultUserRole.CvaManager],
      accessGroups: [
        {
          programRegistrationAttributeName: 'province',
          value: 'utrecht',
        },
      ],
      adminAccessToken: accessToken,
    });
    await uploadAttachment({
      programId,
      filePath: testImagePath,
      filename: 'Utrecht Attachment',
      accessToken: await getAccessTokenScoped(DebugScope.Kisumu),
    });
    // Only the attachment uses the level once the access groups of the uploader are removed
    await assignUserToProgram({
      programId,
      userId: uploaderUserId,
      roles: [DefaultUserRole.CvaManager],
      accessGroups: [],
      adminAccessToken: accessToken,
    });

    // Act
    const response = await updateProgramAccessGroupLevels(
      programId,
      { accessGroupRegistrationAttributeNames: ['district'] },
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.message).toContain('used by files');
    const accessGroupLevels = await getProgramAccessGroupLevels(
      programId,
      accessToken,
    );
    expect(accessGroupLevels.body).toStrictEqual({
      accessGroupRegistrationAttributeNames: ['province'],
    });
  });
});
