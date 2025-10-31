/* eslint-disable @typescript-eslint/no-empty-function */
import { UserOwnerDto } from '@121-service/src/user/dto/user-owner.dto';
import { UserEntity } from '@121-service/src/user/entities/user.entity';
import { UserType } from '@121-service/src/user/enum/user-type-enum';
import { UserMapper } from '@121-service/src/user/utils/user.mapper';

describe('User mapper', () => {
  it('should map to correct object', async () => {
    // Arrange
    const userId = 1;
    const username = 'test@example.org';
    const user: UserEntity = {
      id: userId,
      username,
      password: 'testPassword',
      programAssignments: [],
      uploadedAttachments: [],
      registrations: [],
      notes: [],
      userType: UserType.aidWorker,
      admin: false,
      isEntraUser: false,
      salt: 'salt',
      active: true,
      lastLogin: new Date(),
      hashPassword: async () => {},
      created: new Date(),
      updated: new Date(),
      isOrganizationAdmin: false,
      displayName: username.split('@')[0],
    };

    const expectedResult: UserOwnerDto = {
      id: userId,
      username,
    };

    // Act
    const mappedUser = UserMapper.entityToOwner(user);

    // Assert
    expect(mappedUser).toEqual(expectedResult);
  });
});
