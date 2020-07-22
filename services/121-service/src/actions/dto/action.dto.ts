import { ApiModelProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsNumber } from 'class-validator';
import { ActionType } from '../action.entity';

export class ActionDto {
  @ApiModelProperty({ example: 'notify-included' })
  @IsNotEmpty()
  @IsEnum(ActionType)
  public readonly actionType: ActionType;

  @ApiModelProperty({ example: 1 })
  @IsNumber()
  public readonly programId: number;
}
