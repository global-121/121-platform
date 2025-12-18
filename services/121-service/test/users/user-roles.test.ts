import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { getUserRoles } from '@121-service/test/helpers/user.helper';
import {
  getAccessToken,
  getServer,
  loginApi,
  logoutUser,
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
      // Arrange
      const roles: string[] = [];
      // Act
      const response = await getUserRoles(accessToken);
      const rolesLength = response.body.length;

      for (let i = 0; i < rolesLength; i++) {
        const role = response.body[i].role;
        roles.push(role);
      }
      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(roles).toMatchSnapshot();
    });

    it('Should update a role by userRoleId', async () => {
      // Arrange
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

      expect(getUserRole.status).toBe(HttpStatus.OK);
      const role = getUserRole.body.find((r: { id: number }) => r.id === 1);

      expect(role.label).toBe(updateData.label);
      expect(role.description).toBe(updateData.description);
    });

    it('Should delete a role by userRoleId', async () => {
      // Arrange
      // Get user roles before delete
      const getUserRoleBeforeDelete = await getUserRoles(accessToken);
      expect(getUserRoleBeforeDelete.status).toBe(HttpStatus.OK);
      const rolesLengthBeforeDelete = getUserRoleBeforeDelete.body.length;
      // Act
      // Delete user role
      const deleteUserRole = await getServer()
        .delete('/roles/2')
        .set('Cookie', [accessToken])
        .send();
      expect(deleteUserRole.status).toBe(HttpStatus.OK);
      // Assert
      // Get user roles after delete
      const getUserRoleAfterDelete = await getUserRoles(accessToken);
      expect(getUserRoleAfterDelete.status).toBe(HttpStatus.OK);
      const rolesLengthAfterDelete = getUserRoleAfterDelete.body.length;
      expect(rolesLengthAfterDelete).toBe(rolesLengthBeforeDelete - 1);
    });

    it('Should get all users', async () => {
      // Arrange
      const users: string[] = [];
      // Act
      const getAllUsers = await getServer()
        .get('/users')
        .set('Cookie', [accessToken])
        .send();
      const usersLength = getAllUsers.body.length;

      for (let i = 0; i < usersLength; i++) {
        const user = getAllUsers.body[i].username;
        users.push(user);
      }
      // Assert
      expect(getAllUsers.status).toBe(HttpStatus.OK);
      expect(users).toMatchSnapshot();
    });

    it('Should logout user', async () => {
      // Arrange

      // Act
      const logoutResponse = await logoutUser(accessToken);
      // Assert
      expect(logoutResponse.status).toBe(HttpStatus.CREATED);
    });

    it('Should change user password', async () => {
      // Arrange
      const changePasswordPayload = {
        username: 'admin@example.org',
        password: 'password',
        newPassword: 'newPassword',
      };
      // Act
      const changePasswordResponse = await getServer()
        .post('/users/password')
        .set('Cookie', [accessToken])
        .send(changePasswordPayload);
      expect(changePasswordResponse.status).toBe(HttpStatus.CREATED);

      const logoutResponse = await logoutUser(accessToken);
      expect(logoutResponse.status).toBe(HttpStatus.CREATED);
      // Assert
      const loginResponseAfterPasswordChange = await loginApi(
        changePasswordPayload.username,
        changePasswordPayload.newPassword,
      );
      expect(loginResponseAfterPasswordChange.status).toBe(HttpStatus.CREATED);
    });
  });
});
