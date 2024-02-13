/* eslint-disable no-empty-function */
import { UserOwnerDto } from '../../../../user/dto/user-owner.dto';
import { UserType } from '../../../../user/user-type-enum';
import { UserEntity } from '../../../../user/user.entity';
import { RegistrationEntity } from '../../../registration.entity';
import { RegistrationChangeLogReturnDto } from '../dto/registration-change-log-return.dto';
import { RegistrationChangeLogEntity } from '../registration-change-log.entity';
import { RegistrationChangeLogMapper } from './registration-change-log.mapper';

describe('Registration change log mapper', () => {
  it('should map to correct object', async () => {
    // Arrange
    const userId = 1;
    const username = 'test@example.org';
    const createdDate = new Date();
    const fieldName = 'testFieldName';
    const oldValue = 'testOldValue';
    const newValue = 'testNewValue';
    const reason = 'Unit test';
    const user: UserEntity = {
      id: userId,
      username: username,
      password: 'testPassword',
      programAssignments: [],
      actions: [],
      registrations: [],
      personAffectedAppData: [],
      changes: [],
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
    const registrationChangeLog: RegistrationChangeLogEntity = {
      registration: {} as RegistrationEntity,
      registrationId: 1,
      user: user,
      userId: userId,
      fieldName: fieldName,
      oldValue: oldValue,
      newValue: newValue,
      reason: reason,
      id: 1,
      created: createdDate,
      updated: new Date(),
    };

    const expectedUserOwnerResult: UserOwnerDto = {
      id: userId,
      username: username,
    };
    const expectedResult: RegistrationChangeLogReturnDto = {
      id: 1,
      registrationId: 1,
      user: expectedUserOwnerResult,
      created: createdDate,
      fieldName: fieldName,
      oldValue: oldValue,
      newValue: newValue,
      reason: reason,
    };

    // Act
    const mappedRegistrationChangeLog =
      RegistrationChangeLogMapper.toRegistrationChangeLogReturnDto(
        registrationChangeLog,
      );

    // Assert
    expect(mappedRegistrationChangeLog).toEqual(expectedResult);
  });
});
