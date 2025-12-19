import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { getUserRoles } from '@121-service/test/helpers/user.helper';
import {
  getAccessToken,
  getServer,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('/ Roles', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.testMultiple, __filename);
    accessToken = await getAccessToken();
  });

  it('should create roles when using valid permissions', async () => {
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
        permissions: ['program.update', fakePermission, 'program:metrics.read'],
      });
    // Assert
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.text).toMatchSnapshot();
  });

  it('should return all user roles', async () => {
    // Act
    const response = await getUserRoles(accessToken);
    const rolesLength = response.body.length;
    // Assert
    expect(response.status).toBe(HttpStatus.OK);
    expect(rolesLength).toBe(10); // all default roles
  });

  it('should update a role by userRoleId', async () => {
    // Arrange
    const userId = 1;
    const updateData = {
      label: 'Updated user role label',
      description: 'Updated user role description',
    };
    // Act
    const updateUserRole = await getServer()
      .put(`/roles/${userId}`)
      .set('Cookie', [accessToken])
      .send(updateData);
    // Assert
    expect(updateUserRole.status).toBe(HttpStatus.OK);
    const getUserRole = await getUserRoles(accessToken);

    expect(getUserRole.status).toBe(HttpStatus.OK);
    const role = getUserRole.body.find((r: { id: number }) => r.id === userId);

    expect(role.label).toBe(updateData.label);
    expect(role.description).toBe(updateData.description);
  });

  it('should delete a role by userRoleId', async () => {
    // Arrange
    const userId = 2;
    // Get user roles before delete
    const getUserRoleBeforeDelete = await getUserRoles(accessToken);
    expect(getUserRoleBeforeDelete.status).toBe(HttpStatus.OK);
    const rolesLengthBeforeDelete = getUserRoleBeforeDelete.body.length;
    // Act
    // Delete user role
    const deleteUserRole = await getServer()
      .delete(`/roles/${userId}`)
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
});
