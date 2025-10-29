/* eslint-disable @typescript-eslint/no-empty-function */
import { ActionEntity } from '@121-service/src/actions/action.entity';
import { ActionReturnDto } from '@121-service/src/actions/dto/action-return.dto';
import { ActionType } from '@121-service/src/actions/enum/action-type.enum';
import { ActionMapper } from '@121-service/src/actions/utils/action.mapper';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { UserOwnerDto } from '@121-service/src/user/dto/user-owner.dto';
import { UserEntity } from '@121-service/src/user/entities/user.entity';
import { UserType } from '@121-service/src/user/enum/user-type-enum';

describe('Action mapper', () => {
  it('should map to correct object', async () => {
    // Arrange
    const userId = 1;
    const actionId = 1;
    const username = 'test@example.org';
    const createdDate = new Date();
    const user: UserEntity = {
      id: userId,
      username,
      password: 'testPassword',
      programAssignments: [],
      uploadedAttachments: [],
      actions: [],
      registrations: [],
      notes: [],
      userType: UserType.aidWorker,
      admin: false,
      isEntraUser: false,
      salt: 'salt',
      active: true,
      lastLogin: new Date(),
      hashPassword: async () => {},
      created: createdDate,
      updated: new Date(),
      isOrganizationAdmin: false,
      displayName: username.split('@')[0],
    };
    const actionEntity: ActionEntity = {
      id: actionId,
      actionType: ActionType.endBlockNewPayment,
      user,
      program: {} as ProgramEntity,
      userId,
      created: createdDate,
      updated: new Date(),
    };

    const expectedUserOwnerResult: UserOwnerDto = {
      id: userId,
      username,
    };
    const expectedResult: ActionReturnDto = {
      id: actionId,
      actionType: ActionType.endBlockNewPayment,
      user: expectedUserOwnerResult,
      created: createdDate,
    };

    // Act
    const mappedAction = ActionMapper.entityToActionReturnDto(actionEntity);

    // Assert
    expect(mappedAction).toEqual(expectedResult);
  });
});
