/* eslint-disable @typescript-eslint/no-empty-function */
import {
  ActionEntity,
  AdditionalActionType,
} from '@121-service/src/actions/action.entity';
import { ActionReturnDto } from '@121-service/src/actions/dto/action-return.dto';
import { ActionMapper } from '@121-service/src/actions/utils/action.mapper';
import { ProjectEntity } from '@121-service/src/projects/project.entity';
import { UserOwnerDto } from '@121-service/src/user/dto/user-owner.dto';
import { UserEntity } from '@121-service/src/user/user.entity';
import { UserType } from '@121-service/src/user/user-type-enum';

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
      projectAssignments: [],
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
      actionType: AdditionalActionType.importRegistrations,
      user,
      project: {} as ProjectEntity,
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
      actionType: AdditionalActionType.importRegistrations,
      user: expectedUserOwnerResult,
      created: createdDate,
    };

    // Act
    const mappedAction = ActionMapper.entityToActionReturnDto(actionEntity);

    // Assert
    expect(mappedAction).toEqual(expectedResult);
  });
});
