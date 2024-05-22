import {
  ActionArray,
  ActionType,
} from '@121-service/src/actions/action.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty } from 'class-validator';

export class ActionDto {
  @ApiProperty({
    enum: ActionArray,
    example: ActionArray.join(' | '),
  })
  @IsNotEmpty()
  @IsIn(ActionArray)
  public readonly actionType: ActionType;
}
