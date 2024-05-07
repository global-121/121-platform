/* eslint-disable @typescript-eslint/no-empty-function */
import { ProgramEntity } from '../../programs/program.entity';
import { UserOwnerDto } from '../../user/dto/user-owner.dto';
import { UserType } from '../../user/user-type-enum';
import { UserEntity } from '../../user/user.entity';
import { ActionEntity, AdditionalActionType } from '../action.entity';
import { ActionReturnDto } from '../dto/action-return.dto';
import { ActionMapper } from './action.mapper';

describe('Action mapper', () => {
  it('should map to correct object', async () => {
    // Arrange
    const userId = 1;
    const actionId = 1;
    const username = 'test@example.org';
    const createdDate = new Date();
    const user: UserEntity = {
      id: userId,
      username: username,
      password: 'testPassword',
      programAssignments: [],
      actions: [],
      registrations: [],
      notes: [],
      userType: UserType.aidWorker,
      admin: false,
      isEntraUser: false,
      cascadeDelete: async () => {},
      salt: 'salt',
      active: true,
      lastLogin: new Date(),
      hashPassword: async () => {},
      deleteAllOneToMany: async () => {},
      deleteOneToMany: async () => {},
      created: createdDate,
      updated: new Date(),
    };
    const actionEntity: ActionEntity = {
      id: actionId,
      actionType: AdditionalActionType.importPeopleAffected,
      user: user,
      program: {} as ProgramEntity,
      userId: userId,
      created: createdDate,
      updated: new Date(),
    };

    const expectedUserOwnerResult: UserOwnerDto = {
      id: userId,
      username: username,
    };
    const expectedResult: ActionReturnDto = {
      id: actionId,
      actionType: AdditionalActionType.importPeopleAffected,
      user: expectedUserOwnerResult,
      created: createdDate,
    };

    // Act
    const mappedAction = ActionMapper.entityToActionReturnDto(actionEntity);

    // Assert
    expect(mappedAction).toEqual(expectedResult);
  });
});
