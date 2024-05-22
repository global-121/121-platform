import {
  ActionArray,
  ActionType,
} from '@121-service/src/actions/action.entity';
import { UserOwnerDto } from '@121-service/src/user/dto/user-owner.dto';
import { ApiProperty } from '@nestjs/swagger';

export class ActionReturnDto {
  @ApiProperty({ example: 1, type: 'number' })
  id: number;
  @ApiProperty({ example: 1, enum: ActionArray })
  actionType: ActionType;
  @ApiProperty({ type: () => UserOwnerDto })
  user: UserOwnerDto;
  @ApiProperty({ example: '2021-09-01T00:00:00.000Z' })
  created: Date;
}
