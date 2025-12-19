import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getAllUsers,
  getAllUsersByProgramId,
  getUserRoles,
} from '@121-service/test/helpers/user.helper';
import {
  getAccessToken,
  getServer,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { programIdPV } from '@121-service/test/registrations/pagination/pagination-data';

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

    it('should return all user roles', async () => {
      // Arrange

      // Act
      const response = await getUserRoles(accessToken);
      const rolesLength = response.body.length;
      console.log('rolesLength: ', rolesLength);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(rolesLength).toBe(10); // all default roles
    });

    it('should update a role by userRoleId', async () => {
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

      // Assert
      expect(updateUserRole.status).toBe(HttpStatus.OK);
      const getUserRole = await getUserRoles(accessToken);

      expect(getUserRole.status).toBe(HttpStatus.OK);
      const role = getUserRole.body.find((r: { id: number }) => r.id === 1);

      expect(role.label).toBe(updateData.label);
      expect(role.description).toBe(updateData.description);
    });

    it('should delete a role by userRoleId', async () => {
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

    it('should get all users', async () => {
      // Arrange

      // Act
      const getAllUsersResponse = await getAllUsers(accessToken);
      const usersLength = getAllUsersResponse.body.length;

      // Assert
      expect(getAllUsersResponse.status).toBe(HttpStatus.OK);
      expect(usersLength).toBe(10);
    });

    it('should get current user', async () => {
      // Arrange
      // Act
      const getCurrentUserResponse = await getServer()
        .get('/users/current')
        .set('Cookie', [accessToken])
        .send();
      // Assert
      const currentUser = getCurrentUserResponse.body.user;

      expect(getCurrentUserResponse.status).toBe(HttpStatus.OK);
      expect(currentUser.username).toBe('admin@example.org');
    });

    it('should return all users assigned to a program', async () => {
      // Arrange

      // Act
      const fetchUsersFromPvProgram = await getAllUsersByProgramId(
        accessToken,
        programIdPV.toString(),
      );
      // Assert
      expect(fetchUsersFromPvProgram.status).toBe(HttpStatus.OK);
      expect(fetchUsersFromPvProgram.body.length).toBe(10);
    });
  });
});
