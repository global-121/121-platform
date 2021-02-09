import { ApiModelProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsIn } from 'class-validator';
import { ActionType, ActionArray } from '../action.entity';

export class ActionDto {
  @ApiModelProperty({
    enum: ActionArray,
    example: ActionArray.join(' | '),
  })
  @IsNotEmpty()
  @IsIn(ActionArray)
  public readonly actionType: ActionType;

  @ApiModelProperty({ example: 1 })
  @IsNumber()
  public readonly programId: number;
}
