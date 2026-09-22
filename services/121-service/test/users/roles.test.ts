import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { DefaultUserRole } from '@121-service/src/user/enum/user-role.enum';
import { getUserRoles } from '@121-service/test/helpers/user.helper';
import {
  getAccessToken,
  getServer,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('/ Roles', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB({ seedScript: SeedScript.testMultiple });
    accessToken = await getAccessToken();
  });

  async function createCustomRole(): Promise<number> {
    const response = await getServer()
      .post('/roles')
      .set('Cookie', [accessToken])
      .send({
        role: 'test-manager',
        label: 'Do stuff with certain permissions',
        description: 'This is a test role',
        permissions: ['program.update', 'program:metrics.read'],
      });
    expect(response.status).toBe(HttpStatus.CREATED);
    return response.body.id;
  }

  async function getDefaultRoleId(role: DefaultUserRole): Promise<number> {
    const response = await getUserRoles(accessToken);
    const defaultRole = response.body.find(
      (r: { role: string }) => r.role === role,
    );
    return defaultRole.id;
  }

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
    expect(response2.body.message).toMatchInlineSnapshot(
      `"Role already exists: test-manager"`,
    );
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
    expect(response.body.message).toMatchInlineSnapshot(
      `"Permission not valid: program.make-up-my-own-permission"`,
    );
  });

  it('should return all user roles', async () => {
    // Act
    const response = await getUserRoles(accessToken);
    const rolesLength = response.body.length;
    // Assert
    expect(response.status).toBe(HttpStatus.OK);
    expect(rolesLength).toBe(12); // all default roles
  });

  it('should update a role by userRoleId', async () => {
    // Arrange
    const userRoleId = await createCustomRole();
    const updateData = {
      label: 'Updated user role label',
      description: 'Updated user role description',
    };
    // Act
    const updateUserRole = await getServer()
      .put(`/roles/${userRoleId}`)
      .set('Cookie', [accessToken])
      .send(updateData);
    // Assert
    expect(updateUserRole.status).toBe(HttpStatus.OK);
    const getUserRole = await getUserRoles(accessToken);

    expect(getUserRole.status).toBe(HttpStatus.OK);
    const role = getUserRole.body.find(
      (r: { id: number }) => r.id === userRoleId,
    );

    expect(role.label).toBe(updateData.label);
    expect(role.description).toBe(updateData.description);
  });

  it('should not update a default role', async () => {
    // Arrange
    const defaultRoleId = await getDefaultRoleId(DefaultUserRole.View);
    // Act
    const response = await getServer()
      .put(`/roles/${defaultRoleId}`)
      .set('Cookie', [accessToken])
      .send({ label: 'Updated user role label' });
    // Assert
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.message).toMatchInlineSnapshot(
      `"Role 'view' is a default role and cannot be updated or deleted"`,
    );
  });

  it('should delete a role by userRoleId', async () => {
    // Arrange
    const userRoleId = await createCustomRole();
    // Get user roles before delete
    const getUserRoleBeforeDelete = await getUserRoles(accessToken);
    expect(getUserRoleBeforeDelete.status).toBe(HttpStatus.OK);
    const rolesLengthBeforeDelete = getUserRoleBeforeDelete.body.length;
    // Act
    // Delete user role
    const deleteUserRole = await getServer()
      .delete(`/roles/${userRoleId}`)
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

  it('should not delete a default role', async () => {
    // Arrange
    const defaultRoleId = await getDefaultRoleId(DefaultUserRole.Admin);
    // Act
    const response = await getServer()
      .delete(`/roles/${defaultRoleId}`)
      .set('Cookie', [accessToken])
      .send();
    // Assert
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.message).toMatchInlineSnapshot(
      `"Role 'admin' is a default role and cannot be updated or deleted"`,
    );
  });
});
