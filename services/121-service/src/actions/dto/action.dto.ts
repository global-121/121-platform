import { ApiModelProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsNumber, IsIn } from 'class-validator';
import { ActionType, ActionArray } from '../action.entity';
import { ExportType } from '../../programs/program/dto/export-details';

export class ActionDto {
  @ApiModelProperty({ example: ActionArray.toString() })
  @IsNotEmpty()
  @IsIn(ActionArray)
  public readonly actionType: ActionType;

  @ApiModelProperty({ example: 1 })
  @IsNumber()
  public readonly programId: number;
}
