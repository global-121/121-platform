import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { DefaultUserRole } from '@121-service/src/user/user-role.enum';
import {
  getAccessToken,
  getServer,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Projects / Users / Roles', () => {
  const projectId = 1;
  const userId = 2;
  const fixtureUserRoles = [
    {
      id: 2,
      role: DefaultUserRole.ProjectAdmin,
      label: 'Project Admin',
    },
    {
      id: 3,
      role: DefaultUserRole.View,
      label: 'Only view data, including Personally Identifiable Information',
    },
    {
      id: 5,
      role: DefaultUserRole.CvaManager,
      label: 'Cash Assistance Project Manager',
    },
  ];

  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.testMultiple, __filename);
    accessToken = await getAccessToken();
  });

  it('should only return user roles and assignments to specific project assignments', async () => {
    // Arrange
    const testUserRoles = fixtureUserRoles;

    // Act
    const response = await getServer()
      .get(`/projects/${projectId}/users/${userId}`)
      .set('Cookie', [accessToken]);

    // Assert
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.roles.length).toBe(1);
    expect(response.body.roles[0].role).toBe(testUserRoles[0].role);
    expect(response.body.roles[0].id).toBe(testUserRoles[0].id);
    expect(response.body.roles[0].label).toBe(testUserRoles[0].label);
  });

  it('should return user roles after update to specific project assignments', async () => {
    // Arrange
    const testUserRoles = fixtureUserRoles;
    const testRoles = {
      roles: ['project-admin', 'cva-manager'],
      scope: 'test',
    };

    // Act
    const response = await getServer()
      .put(`/projects/${projectId}/users/${userId}`)
      .set('Cookie', [accessToken])
      .send(testRoles);

    // Assert
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.roles.length).toBe(2);
    expect(response.body.roles[0].role).toBe(testUserRoles[0].role);
    expect(response.body.roles[0].id).toBe(testUserRoles[0].id);
    expect(response.body.roles[0].label).toBe(testUserRoles[0].label);
  });

  it('should return an error when a user tries to assign roles to themselves', async () => {
    // Arrange
    const selfUserId = 1; // Assuming the logged-in user has ID 1
    const testRoles = {
      roles: ['project-admin'],
      scope: 'test',
    };

    // Act
    const response = await getServer()
      .put(`/projects/${projectId}/users/${selfUserId}`)
      .set('Cookie', [accessToken])
      .send(testRoles);

    // Assert
    expect(response.status).toBe(HttpStatus.FORBIDDEN);
    expect(response.body.message).toMatchSnapshot();
  });

  it('should return user roles after add new role to specific project assignment', async () => {
    // Arrange
    const testUserRoles = fixtureUserRoles;
    const testRoles = {
      rolesToAdd: ['view'],
      scope: 'test',
    };

    // Act
    const response = await getServer()
      .patch(`/projects/${projectId}/users/${userId}`)
      .set('Cookie', [accessToken])
      .send(testRoles);

    // Assert
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.roles.length).toBe(2);
    expect(response.body.roles[1].role).toBe(testUserRoles[1].role);
    expect(response.body.roles[1].id).toBe(testUserRoles[1].id);
    expect(response.body.roles[1].label).toBe(testUserRoles[1].label);
  });

  it('should return user roles after delete roles from specific project assignment', async () => {
    // Arrange
    const testUserRoles = fixtureUserRoles;
    const testRoles = {
      rolesToDelete: ['view', 'cva-manager'],
    };

    // Act
    const response = await getServer()
      .delete(`/projects/${projectId}/users/${userId}`)
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
