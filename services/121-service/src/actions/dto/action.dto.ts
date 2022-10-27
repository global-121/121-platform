import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty } from 'class-validator';
import { ActionArray, ActionType } from '../action.entity';

export class ActionDto {
  @ApiProperty({
    enum: ActionArray,
    example: ActionArray.join(' | '),
  })
  @IsNotEmpty()
  @IsIn(ActionArray)
  public readonly actionType: ActionType;
}
