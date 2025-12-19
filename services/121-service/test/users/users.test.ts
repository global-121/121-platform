import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { getAllUsers } from '@121-service/test/helpers/user.helper';
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

    it('should logout user', async () => {
      // Arrange

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
        .delete('/users/2')
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

    // NOTE: for this reset of password it seems like only the correct response status can be validated
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
      const updateData = {
        isOrganizationAdmin: true,
        displayName: 'Updated Display Name',
      };
      // Act
      const updateUserResponse = await getServer()
        .patch('/users/2')
        .set('Cookie', [accessToken])
        .send(updateData);
      // Assert
      expect(updateUserResponse.status).toBe(HttpStatus.OK);
      const getUsersResponse = await getAllUsers(accessToken);
      expect(getUsersResponse.status).toBe(HttpStatus.OK);
      const updatedUser = getUsersResponse.body.find(
        (r: { id: number }) => r.id === 2,
      );
      expect(updatedUser.isOrganizationAdmin).toBe(
        updateData.isOrganizationAdmin,
      );
      expect(updatedUser.displayName).toBe(updateData.displayName);
    });
  });
});
