import { UserMapper } from '../../user/utils/user.mapper';
import { ActionEntity } from '../action.entity';
import { ActionReturnDto } from '../dto/action-return.dto';

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
