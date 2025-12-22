import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getAllUsers,
  getAllUsersByProgramId,
} from '@121-service/test/helpers/user.helper';
import {
  getAccessToken,
  getServer,
  loginApi,
  logoutUser,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { programIdPV } from '@121-service/test/registrations/pagination/pagination-data';

describe('/ Users', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.testMultiple, __filename);
    accessToken = await getAccessToken();
  });

  it('should logout user', async () => {
    // Act
    const logoutResponse = await logoutUser(accessToken);
    // Assert
    expect(logoutResponse.status).toBe(HttpStatus.CREATED);
  });

  it('should change user password', async () => {
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

  it('should delete user', async () => {
    // Arrange
    const userId = 2;
    const userListBeforeDelete: string[] = [];
    const userListAfterDelete: string[] = [];
    // Act
    const getAllUsersBeforeDelete = await getAllUsers(accessToken);
    const usersLengthBeforeDelete = getAllUsersBeforeDelete.body.length;

    for (let i = 0; i < usersLengthBeforeDelete; i++) {
      const user = getAllUsersBeforeDelete.body[i].username;
      userListBeforeDelete.push(user);
    }

    const deleteUserResponse = await getServer()
      .delete(`/users/${userId}`)
      .set('Cookie', [accessToken])
      .send();
    // Assert
    expect(deleteUserResponse.status).toBe(HttpStatus.OK);
    const getAllUsersAfterDelete = await getAllUsers(accessToken);
    const usersLengthAfterDelete = getAllUsersAfterDelete.body.length;

    for (let i = 0; i < usersLengthAfterDelete; i++) {
      const user = getAllUsersAfterDelete.body[i].username;
      userListAfterDelete.push(user);
    }
    expect(usersLengthAfterDelete).toBe(usersLengthBeforeDelete - 1);
    expect(userListAfterDelete).not.toEqual(userListBeforeDelete);
  });

  it('should reset user password', async () => {
    // Arrange
    const resetPasswordPayload = { username: 'admin@example.org' };
    // Act
    const resetPasswordResponse = await getServer()
      .patch('/users/password')
      .set('Cookie', [accessToken])
      .send(resetPasswordPayload);
    // Assert
    expect(resetPasswordResponse.status).toBe(HttpStatus.NO_CONTENT);
  });

  it('should update user properties (isOrganizationAdmin, displayName)', async () => {
    // Arrange
    const userId = 2;
    const updateData = {
      isOrganizationAdmin: true,
      displayName: 'Updated Display Name',
    };
    // Act
    const updateUserResponse = await getServer()
      .patch(`/users/${userId}`)
      .set('Cookie', [accessToken])
      .send(updateData);
    // Assert
    expect(updateUserResponse.status).toBe(HttpStatus.OK);
    const getUsersResponse = await getAllUsers(accessToken);
    expect(getUsersResponse.status).toBe(HttpStatus.OK);
    const updatedUser = getUsersResponse.body.find(
      (r: { id: number }) => r.id === userId,
    );
    expect(updatedUser.isOrganizationAdmin).toBe(
      updateData.isOrganizationAdmin,
    );
    expect(updatedUser.displayName).toBe(updateData.displayName);
  });

  it('should get all users', async () => {
    // Act
    const getAllUsersResponse = await getAllUsers(accessToken);
    const usersLength = getAllUsersResponse.body.length;

    // Assert
    expect(getAllUsersResponse.status).toBe(HttpStatus.OK);
    expect(usersLength).toBe(10); // 1 user per default role
  });

  it('should get current user', async () => {
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
    // Act
    const fetchUsersFromPvProgram = await getAllUsersByProgramId(
      accessToken,
      programIdPV.toString(),
    );
    // Assert
    expect(fetchUsersFromPvProgram.status).toBe(HttpStatus.OK);
    expect(fetchUsersFromPvProgram.body.length).toBe(10); // There should be 10 users assigned to the PV program
  });
});
