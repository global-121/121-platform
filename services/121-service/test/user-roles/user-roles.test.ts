import { HttpStatus } from '@nestjs/common';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { getAccessToken, getServer, resetDB } from '../helpers/utility.helper';

describe('Load PA table', () => {
  const programId = 1;
  const userId = 2;
  const fixtureUserRoles = [
    {
      id: 2,
      role: 'program-admin',
      label: 'Program Admin',
    },
    {
      id: 3,
      role: 'view',
      label: 'Only view data, including Personally Identifiable Information',
    },
    {
      id: 5,
      role: 'cva-manager',
      label: 'Cash Assistance Program Manager',
    },
  ];

  // This test takes a lot of time because there are many statuses to check
  jest.setTimeout(20_000);

  describe('using the "attributes" query-parameter', () => {
    let accessToken: string;

    beforeEach(async () => {
      accessToken = await getAccessToken();
    });

    it('should only return user roles and assignment to specific program assignments', async () => {
      await resetDB(SeedScript.test);
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
        roles: ['view'],
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
        roles: ['view', 'cva-manager'],
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
});
