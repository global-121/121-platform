import { HttpStatus } from '@nestjs/common';
import { SeedScript } from '../../../../src/scripts/seed-script.enum';
import { DefaultUserRole } from '../../../../src/user/user-role.enum';
import {
  getAccessToken,
  getServer,
  resetDB,
} from '../../helpers/utility.helper';

describe('Programs / Users / Roles', () => {
  const programId = 1;
  const userId = 2;
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

  let accessToken: string;

  beforeAll(async () => {
    await resetDB(SeedScript.test);
    // Apparently reseeding takes more then default timeout:
  }, 20_000);

  beforeEach(async () => {
    accessToken = await getAccessToken();
  });

  it('should only return user roles and assignments to specific program assignments', async () => {
    // Arrange
    const testUserRoles = fixtureUserRoles;

    // Act
    const response = await getServer()
      .get(`/programs/${programId}/users/${userId}`)
      .set('Cookie', [accessToken]);

    // Assert
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.roles.length).toBe(1);
    expect(response.body.roles[0].role).toBe(testUserRoles[0].role);
    expect(response.body.roles[0].id).toBe(testUserRoles[0].id);
    expect(response.body.roles[0].label).toBe(testUserRoles[0].label);
  });

  it('should return user roles after update to specific program assignments', async () => {
    // Arrange
    const testUserRoles = fixtureUserRoles;
    const testRoles = {
      roles: ['program-admin', 'cva-manager'],
      scope: 'test',
    };

    // Act
    const response = await getServer()
      .put(`/programs/${programId}/users/${userId}`)
      .set('Cookie', [accessToken])
      .send(testRoles);

    // Assert
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.roles.length).toBe(2);
    expect(response.body.roles[0].role).toBe(testUserRoles[0].role);
    expect(response.body.roles[0].id).toBe(testUserRoles[0].id);
    expect(response.body.roles[0].label).toBe(testUserRoles[0].label);
  });

  it('should return user roles after add new role to specific program assignment', async () => {
    // Arrange
    const testUserRoles = fixtureUserRoles;
    const testRoles = {
      rolesToAdd: ['view'],
      scope: 'test',
    };

    // Act
    const response = await getServer()
      .patch(`/programs/${programId}/users/${userId}`)
      .set('Cookie', [accessToken])
      .send(testRoles);

    // Assert
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.roles.length).toBe(3);
    expect(response.body.roles[2].role).toBe(testUserRoles[1].role);
    expect(response.body.roles[2].id).toBe(testUserRoles[1].id);
    expect(response.body.roles[2].label).toBe(testUserRoles[1].label);
  });

  it('should return user roles after delete roles from specific program assignment', async () => {
    // Arrange
    const testUserRoles = fixtureUserRoles;
    const testRoles = {
      rolesToDelete: ['view', 'cva-manager'],
      scope: 'test',
    };

    // Act
    const response = await getServer()
      .delete(`/programs/${programId}/users/${userId}`)
      .set('Cookie', [accessToken])
      .send(testRoles);

    // Assert
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.roles.length).toBe(1);
    expect(response.body.roles[0].role).toBe(testUserRoles[0].role);
    expect(response.body.roles[0].id).toBe(testUserRoles[0].id);
    expect(response.body.roles[0].label).toBe(testUserRoles[0].label);
  });
});
