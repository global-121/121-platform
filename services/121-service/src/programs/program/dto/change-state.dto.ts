import { ApiModelProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsIn,
} from 'class-validator';

export class ChangeStateDto {
  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  @IsIn(['design', 'registration', 'inclusion', 'finalize', 'payment', 'evaluation'])
  public readonly newState: string;
}
