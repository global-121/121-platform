import { ActionEntity } from '@121-service/src/actions/action.entity';
import { ActionReturnDto } from '@121-service/src/actions/dto/action-return.dto';
import { UserMapper } from '@121-service/src/user/utils/user.mapper';

export class ActionMapper {
  static entityToActionReturnDto(actionEntity: ActionEntity): ActionReturnDto {
    const actionReturnDto = new ActionReturnDto();
    actionReturnDto.actionType = actionEntity.actionType;
    actionReturnDto.user = UserMapper.entityToOwner(actionEntity.user);
    actionReturnDto.created = actionEntity.created;
    actionReturnDto.id = actionEntity.id;
    return actionReturnDto;
  }
}
