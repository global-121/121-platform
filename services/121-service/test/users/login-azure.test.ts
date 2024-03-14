import { HttpStatus } from '@nestjs/common';
import programEth from '../../seed-data/program/program-joint-response-dorcas.json';
import programOCW from '../../seed-data/program/program-nlrc-ocw.json';
import { ExportType } from '../../src/metrics/dto/export-details.dto';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../src/shared/enum/program-phase.enum';
import { DefaultUserRole } from '../../src/user/user-role.enum';
import {
  assertArraysAreEqual,
  assertObjectsAreEqual,
} from '../helpers/assert.helper';
import {
  getAssignedPrograms,
  getProgram,
  postProgram,
  postProgramQuestion,
} from '../helpers/program.helper';
import { getCurrentUser } from '../helpers/user.helper';
import {
  azureLogin,
  getAccessToken,
  getServer,
  resetDB,
} from '../helpers/utility.helper';
import { programIdPV } from '../registrations/pagination/pagination-data';

describe('/ Users', () => {
  describe('/ Azure Login', () => {
    const programId = 2;
    let user;
    let azureAccessToken;
    let accessToken;
    const fixtureUserRoles = [
      {
        id: 2,
        role: DefaultUserRole.ProgramAdmin,
        label: 'Program Admin',
      },
      {
        id: 3,
        role: DefaultUserRole.View,
        label: 'Only view data, including Personally Identifiable Information',
      },
      {
        id: 5,
        role: DefaultUserRole.CvaManager,
        label: 'Cash Assistance Program Manager',
      },
    ];
    const programQuestion = {
      name: 'test',
      options: {},
      scoring: {},
      persistence: true,
      pattern: 'string',
      phases: [
        ProgramPhase.registrationValidation,
        ProgramPhase.inclusion,
        ProgramPhase.payment,
      ],
      editableInPortal: true,
      export: [ExportType.allPeopleAffected, ExportType.included],
      shortLabel: {
        en: 'Last Name',
      },
      placeholder: {
        en: '+31 6 00 00 00 00',
      },
      duplicateCheck: false,
      label: {
        en: 'Please enter your last name:',
        fr: "Remplissez votre nom, s'il vous plaît:",
      },
      answerType: 'text',
      questionType: 'standard',
    };
    const fixtureUser = {
      username: process.env.USERCONFIG_121_SERVICE_EMAIL_AZURE_LOGIN,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_AZURE_LOGIN,
    };

    beforeAll(async () => {
      await resetDB(SeedScript.nlrcMultiple);
      accessToken = await getAccessToken();
    });

    it('should get Azure AD token', async () => {
      azureAccessToken = await azureLogin(
        fixtureUser.username,
        fixtureUser.password,
      );
    });

    it('should access protected endpoint with valid Azure AD token', async () => {
      const getProgramResponse = await getCurrentUser(azureAccessToken);
      user = getProgramResponse.body.user;

      expect(getProgramResponse.status).toBe(200);
    });

    it('should return user roles after update to specific program assignments', async () => {
      // Arrange
      const testUserRoles = fixtureUserRoles;
      const testRoles = {
        roles: ['program-admin', 'cva-manager'],
        scope: '',
      };

      // Act
      const response = await getServer()
        .put(`/programs/${programId}/users/${user.id}`)
        .set('Cookie', [accessToken])
        .send(testRoles);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.roles.length).toBe(2);
      expect(response.body.roles[0].role).toBe(testUserRoles[0].role);
      expect(response.body.roles[0].id).toBe(testUserRoles[0].id);
      expect(response.body.roles[0].label).toBe(testUserRoles[0].label);
    });

    it('should post a program', async () => {
      // Arrange
      const programOcwJson = JSON.parse(JSON.stringify(programOCW));
      const programEthJson = JSON.parse(JSON.stringify(programEth));
      const programs = [programOcwJson, programEthJson];
      for (const program of programs) {
        // Act
        const createProgramResponse = await postProgram(program, accessToken);

        // Assert
        const programId = createProgramResponse.body.id;
        const getProgramResponse = await getProgram(programId, accessToken);
        expect(createProgramResponse.statusCode).toBe(HttpStatus.CREATED);
        // expect(isEqual(getProgramResponse.body, programOCW)).toBe(true);
        const keyToIgnore = ['configuration', 'startDate', 'endDate'];
        for (const key in program) {
          if (!keyToIgnore.includes(key)) {
            if (Array.isArray(getProgramResponse.body[key])) {
              // If both properties are arrays, compare length and values
              assertArraysAreEqual(
                getProgramResponse.body[key],
                program[key],
                keyToIgnore,
              );
            } else if (typeof getProgramResponse.body[key] === 'object') {
              // If both properties are objects, recursively validate
              assertObjectsAreEqual(
                getProgramResponse.body[key],
                program[key],
                keyToIgnore,
              );
            } else {
              expect(getProgramResponse.body[key]).toBe(program[key]);
              // Compare values
            }
          }
        }
      }
    });

    it('should post a program questions', async () => {
      // Act
      const createReponse = await postProgramQuestion(
        programQuestion as any,
        programIdPV,
        azureAccessToken,
        true,
      );

      // Assert
      expect(createReponse.statusCode).toBe(HttpStatus.CREATED);
    });

    it('should get all assigned programs for a user', async () => {
      // Act
      const programsAssigned = await getAssignedPrograms(
        azureAccessToken,
        true,
      );

      // Assert
      expect(programsAssigned.status).toBe(HttpStatus.OK);
      expect(programsAssigned.body.programs.length).toBe(1);
      expect(programsAssigned.body.programs[0].id).toBe(programId);
    });
  });
});
