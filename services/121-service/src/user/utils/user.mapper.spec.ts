/* eslint-disable @typescript-eslint/no-empty-function */
import { UserOwnerDto } from '../dto/user-owner.dto';
import { UserType } from '../user-type-enum';
import { UserEntity } from '../user.entity';
import { UserMapper } from './user.mapper';

describe('User mapper', () => {
  it('should map to correct object', async () => {
    // Arrange
    const userId = 1;
    const username = 'test@example.org';
    const user: UserEntity = {
      id: userId,
      username: username,
      password: 'testPassword',
      programAssignments: [],
      actions: [],
      registrations: [],
      personAffectedAppData: [],
      notes: [],
      userType: UserType.aidWorker,
      admin: false,
      cascadeDelete: async () => {},
      salt: 'salt',
      active: true,
      lastLogin: new Date(),
      hashPassword: async () => {},
      deleteAllOneToMany: async () => {},
      deleteOneToMany: async () => {},
      created: new Date(),
      updated: new Date(),
    };

    const expectedResult: UserOwnerDto = {
      id: userId,
      username: username,
    };

    // Act
    const mappedUser = UserMapper.entityToOwner(user);

    // Assert
    expect(mappedUser).toEqual(expectedResult);
  });
});
