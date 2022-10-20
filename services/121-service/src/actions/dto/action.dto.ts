import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsIn } from 'class-validator';
import { ActionType, ActionArray } from '../action.entity';

export class ActionDto {
  @ApiProperty({
    enum: ActionArray,
    example: ActionArray.join(' | '),
  })
  @IsNotEmpty()
  @IsIn(ActionArray)
  public readonly actionType: ActionType;
}
