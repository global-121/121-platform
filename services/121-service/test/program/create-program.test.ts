import { HttpStatus } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import programCbe from '@121-service/src/seed-data/program/program-cbe.json';
import programOCW from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import { DefaultUserRole } from '@121-service/src/user/enum/user-role.enum';
import {
  getProgram,
  postProgram,
} from '@121-service/test/helpers/program.helper';
import {
  getAllUsersByProgramId,
  updateUser,
} from '@121-service/test/helpers/user.helper';
import {
  cleanProgramForAssertions,
  createUser,
  getAccessToken,
  logoutUser,
  resetDB,
  setUserPassword,
} from '@121-service/test/helpers/utility.helper';

describe('Create program', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB({ seedScript: SeedScript.nlrcMultiple });
    accessToken = await getAccessToken();
  });

  it('should post a program', async () => {
    // Arrange
    // we do this because dates in JSON are not Date objects
    const programOcwJson = JSON.parse(JSON.stringify(programOCW));
    const programCbeJson = JSON.parse(JSON.stringify(programCbe));
    const seedPrograms = [programOcwJson, programCbeJson];

    for (const seedProgram of seedPrograms) {
      // Act
      const createProgramResponse = await postProgram(seedProgram, accessToken);

      // Assert
      const programId = createProgramResponse.body.id;
      const getProgramResponse = await getProgram(programId, accessToken);
      expect(createProgramResponse.statusCode).toBe(HttpStatus.CREATED);

      const cleanedSeedProgram = cleanProgramForAssertions(seedProgram);
      const cleanedProgramResponse = cleanProgramForAssertions(
        getProgramResponse.body,
      );

      expect(cleanedProgramResponse).toMatchSnapshot(
        `Create program response for program: ${seedProgram.titlePortal.en}`,
      );

      expect(cleanedProgramResponse).toMatchObject(cleanedSeedProgram);
    }
  });

  it('should post a program with the minimum amount of attributes', async () => {
    // Arrange
    const minimalProgram = {
      titlePortal: {
        en: 'Test Title',
      },
      currency: CurrencyCode.EUR,
    };

    // Act
    const createProgramResponse = await postProgram(
      minimalProgram,
      accessToken,
    );

    // Assert
    expect(createProgramResponse.statusCode).toBe(HttpStatus.CREATED);
    const expectedTitlePortal = 'Test Title';
    const expectedCurrency = CurrencyCode.EUR;
    expect(createProgramResponse.body).toEqual(
      expect.objectContaining({
        titlePortal: expect.objectContaining({
          en: expectedTitlePortal,
        }),
        currency: expectedCurrency,
      }),
    );
  });

  it('should fallback to ["fullName"] as the fullnameNamingConvention if the mininum amount of attributes is provided', async () => {
    // Arrange
    const minimalProgram = {
      titlePortal: {
        en: 'Test Title',
      },
      currency: CurrencyCode.EUR,
    };

    // Act
    const createProgramResponse = await postProgram(
      minimalProgram,
      accessToken,
    );

    // Assert
    expect(createProgramResponse.body).toEqual(
      expect.objectContaining({
        fullnameNamingConvention: ['fullName'],
      }),
    );
  });

  it('should add "fullName" to the programRegistrationAttributes if the mininum amount of attributes is provided', async () => {
    // Arrange
    const minimalProgram = {
      titlePortal: {
        en: 'Test Title',
      },
      currency: CurrencyCode.EUR,
    };

    // Act
    const createProgramResponse = await postProgram(
      minimalProgram,
      accessToken,
    );

    // Assert
    expect(createProgramResponse.body).toEqual(
      expect.objectContaining({
        programRegistrationAttributes: expect.arrayContaining([
          expect.objectContaining({
            name: 'fullName',
            label: expect.objectContaining({ en: 'Full name' }),
            type: 'text',
          }),
        ]),
      }),
    );
  });

  it('should not fallback to ["fullName"] if fullnameNamingConvention is provided', async () => {
    // Arrange
    const minimalProgram = {
      titlePortal: {
        en: 'Test Title',
      },
      currency: CurrencyCode.EUR,
      fullnameNamingConvention: ['firstName', 'lastName'],
    };

    // Act
    const createProgramResponse = await postProgram(
      minimalProgram,
      accessToken,
    );

    // Assert
    expect(createProgramResponse.body).toEqual(
      expect.objectContaining({
        fullnameNamingConvention: ['firstName', 'lastName'],
      }),
    );
  });

  it('should add programRegistrationAttributes for all fullnameNamingConvention fields provided', async () => {
    // Arrange
    const minimalProgram = {
      titlePortal: {
        en: 'Test Title',
      },
      currency: CurrencyCode.EUR,
      fullnameNamingConvention: ['firstName', 'lastName'],
    };

    // Act
    const createProgramResponse = await postProgram(
      minimalProgram,
      accessToken,
    );

    // Assert
    expect(createProgramResponse.body).toEqual(
      expect.objectContaining({
        programRegistrationAttributes: expect.arrayContaining([
          expect.objectContaining({
            name: 'firstName',
            label: expect.objectContaining({ en: 'firstName' }),
            type: 'text',
          }),
          expect.objectContaining({
            name: 'lastName',
            label: expect.objectContaining({ en: 'lastName' }),
            type: 'text',
          }),
        ]),
      }),
    );
  });

  it('should add "phoneNumber" to the programRegistrationAttributes if it\'s not provided', async () => {
    // Arrange
    const minimalProgram = {
      titlePortal: {
        en: 'Test Title',
      },
      currency: CurrencyCode.EUR,
    };

    // Act
    const createProgramResponse = await postProgram(
      minimalProgram,
      accessToken,
    );

    // Assert
    expect(createProgramResponse.body).toEqual(
      expect.objectContaining({
        programRegistrationAttributes: expect.arrayContaining([
          expect.objectContaining({
            name: 'phoneNumber',
            label: expect.objectContaining({ en: 'Phone number' }),
            type: 'tel',
          }),
        ]),
      }),
    );
  });

  it('should not be able to post a program with 2 attributes that have the same name', async () => {
    // Arrange
    const programCbeJson = JSON.parse(JSON.stringify(programCbe));
    programCbeJson.programRegistrationAttributes.push(
      programCbeJson.programRegistrationAttributes[0],
    );
    // Act
    const createProgramResponse = await postProgram(
      programCbeJson,
      accessToken,
    );
    const getProgramResponse = await getProgram(4, accessToken);

    // Assert
    expect(createProgramResponse.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(createProgramResponse.body.errors).toBe(
      "The following names: 'fullName' are used more than once in program registration attributes",
    );

    // A new program should not have been created
    expect(getProgramResponse.statusCode).toBe(HttpStatus.NOT_FOUND);
  });

  it('should assign existing admin users to a newly created program, even when the creator is not an admin', async () => {
    // Arrange: create an organization-admin (non-admin) user who will create the program
    const organizationAdminUsername = 'org-admin-creator@example.org';
    const organizationAdminPassword = 'org-admin-creator-password';

    await createUser({
      username: organizationAdminUsername,
      displayName: 'Org Admin Creator',
      adminAccessToken: accessToken,
    });
    const { id: organizationAdminUserId } = await setUserPassword({
      username: organizationAdminUsername,
      newPassword: organizationAdminPassword,
      adminAccessToken: accessToken,
    });
    await updateUser({
      userId: organizationAdminUserId,
      isOrganizationAdmin: true,
      accessToken,
    });

    const organizationAdminAccessToken = await getAccessToken(
      organizationAdminUsername,
      organizationAdminPassword,
    );

    const minimalProgram = {
      titlePortal: { en: 'Program created by organization admin' },
      currency: CurrencyCode.EUR,
    };

    // Act
    const createProgramResponse = await postProgram(
      minimalProgram,
      organizationAdminAccessToken,
    );

    // Assert
    expect(createProgramResponse.statusCode).toBe(HttpStatus.CREATED);
    const programId = createProgramResponse.body.id;

    const programUsersResponse = await getAllUsersByProgramId({
      accessToken,
      programId,
    });
    const programUsers: {
      username: string;
      roles: { role: string }[];
    }[] = programUsersResponse.body;

    const seedAdmin = programUsers.find(
      (user) => user.username === env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    );
    expect(seedAdmin).toBeDefined();
    expect(seedAdmin?.roles.map((role) => role.role)).toContain(
      DefaultUserRole.Admin,
    );

    const creator = programUsers.find(
      (user) => user.username === organizationAdminUsername,
    );
    expect(creator).toBeDefined();
    expect(creator?.roles.map((role) => role.role)).toContain(
      DefaultUserRole.ProgramAdmin,
    );
  });

  it.each([
    {
      email: env.USERCONFIG_121_SERVICE_EMAIL_PROGRAM_ADMIN,
      password: env.USERCONFIG_121_SERVICE_PASSWORD_PROGRAM_ADMIN,
    },

    {
      email: env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW,
      password: env.USERCONFIG_121_SERVICE_PASSWORD_USER_VIEW,
    },

    {
      email: env.USERCONFIG_121_SERVICE_EMAIL_USER_KOBO_REGISTRATION,
      password: env.USERCONFIG_121_SERVICE_PASSWORD_USER_KOBO_REGISTRATION,
    },

    {
      email: env.USERCONFIG_121_SERVICE_EMAIL_USER_KOBO_VALIDATION,
      password: env.USERCONFIG_121_SERVICE_PASSWORD_USER_KOBO_VALIDATION,
    },

    {
      email: env.USERCONFIG_121_SERVICE_EMAIL_CVA_MANAGER,
      password: env.USERCONFIG_121_SERVICE_PASSWORD_CVA_MANAGER,
    },

    {
      email: env.USERCONFIG_121_SERVICE_EMAIL_CVA_OFFICER,
      password: env.USERCONFIG_121_SERVICE_PASSWORD_CVA_OFFICER,
    },

    {
      email: env.USERCONFIG_121_SERVICE_EMAIL_FINANCE_MANAGER,
      password: env.USERCONFIG_121_SERVICE_PASSWORD_FINANCE_MANAGER,
    },

    {
      email: env.USERCONFIG_121_SERVICE_EMAIL_FINANCE_OFFICER,
      password: env.USERCONFIG_121_SERVICE_PASSWORD_FINANCE_OFFICER,
    },

    {
      email: env.USERCONFIG_121_SERVICE_EMAIL_VIEW_WITHOUT_PII,
      password: env.USERCONFIG_121_SERVICE_PASSWORD_VIEW_WITHOUT_PII,
    },
  ])(
    'should not be able to post a program without correct permissions',
    async ({ email, password }) => {
      // Arrange
      // we do this because dates in JSON are not Date objects
      const programOcwJson = JSON.parse(JSON.stringify(programOCW));

      await logoutUser(accessToken);
      accessToken = await getAccessToken(email, password);
      if (!email || !password) {
        throw new Error(
          'Missing USERCONFIG_121_SERVICE_* user credentials in env; required for create-program permission test.',
        );
      }

      // Act
      const createProgramResponse = await postProgram(
        programOcwJson,
        accessToken,
      );

      expect(createProgramResponse.statusCode).toBe(HttpStatus.FORBIDDEN);
    },
  );
});
