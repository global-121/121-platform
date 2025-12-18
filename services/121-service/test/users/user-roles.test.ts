import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { getUserRoles } from '@121-service/test/helpers/user.helper';
import {
  getAccessToken,
  getServer,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('/ Users', () => {
  describe('/ Roles', () => {
    let accessToken: string;

    beforeEach(async () => {
      await resetDB(SeedScript.testMultiple, __filename);
      accessToken = await getAccessToken();
    });

    it('should create roles when using valid permissions', async () => {
      // Arrange

      // Act
      const response = await getServer()
        .post('/roles')
        .set('Cookie', [accessToken])
        .send({
          role: 'test-manager',
          label: 'Do stuff with certain permissions',
          description: 'This is a test role',
          permissions: ['program.update', 'program:metrics.read'],
        });

      // Assert
      expect(response.status).toBe(HttpStatus.CREATED);
    });

    it('should not create a role when the role already exists', async () => {
      // Arrange
      const roleId = 'test-manager';

      // Act
      const response = await getServer()
        .post('/roles')
        .set('Cookie', [accessToken])
        .send({
          role: roleId,
          label: 'Do stuff with certain permissions',
          description: 'This is a test role',
          permissions: ['program.update', 'program:metrics.read'],
        });

      // Assert
      expect(response.status).toBe(HttpStatus.CREATED);

      // Act
      const response2 = await getServer()
        .post('/roles')
        .set('Cookie', [accessToken])
        .send({
          role: roleId,
          label: 'Do stuff with certain permissions',
          description: 'This is a test role',
          permissions: ['program.update', 'program:metrics.read'],
        });

      // Assert
      expect(response2.status).toBe(HttpStatus.CONFLICT);
      expect(response2.text).toMatchSnapshot();
    });

    it('should not create a role when using a permission that does not exist', async () => {
      // Arrange
      const fakePermission = 'program.make-up-my-own-permission';

      // Act
      const response = await getServer()
        .post('/roles')
        .set('Cookie', [accessToken])
        .send({
          role: 'test-manager',
          label: 'Do stuff with certain permissions',
          description: 'This is a test role',
          permissions: [
            'program.update',
            fakePermission,
            'program:metrics.read',
          ],
        });

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.text).toMatchSnapshot();
    });

    it('Should return all user roles', async () => {
      // Act
      const response = await getUserRoles(accessToken);

      const rolesLength = response.body.length;
      const roles: string[] = [];

      for (let i = 0; i < rolesLength; i++) {
        const role = response.body[i].role;
        roles.push(role);
      }
      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(roles).toMatchSnapshot();
    });

    it('Should update a role by userRoleId', async () => {
      const updateData = {
        label: 'Updated user role label',
        description: 'Updated user role description',
      };
      // Act
      const updateUserRole = await getServer()
        .put('/roles/1')
        .set('Cookie', [accessToken])
        .send(updateData);

      expect(updateUserRole.status).toBe(HttpStatus.OK);
      // Assert
      const getUserRole = await getUserRoles(accessToken);
      const role = getUserRole.body.find((r: { id: number }) => r.id === 1);
      // Assert
      expect(role.label).toBe(updateData.label);
      expect(role.description).toBe(updateData.description);
    });
  });
});
