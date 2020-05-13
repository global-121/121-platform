import { ApiModelProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { ProgramPhase } from '../program.entity';

export class ChangeStateDto {
  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  @IsEnum(ProgramPhase)
  public readonly newState: string;
}
