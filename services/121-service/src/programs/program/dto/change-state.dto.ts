import { ApiModelProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { ProgramPhase } from '../../../models/program-phase.model';

export class ChangeStateDto {
  @ApiModelProperty({ example: 'registrationValidation' })
  @IsNotEmpty()
  @IsString()
  @IsEnum(ProgramPhase)
  public readonly newState: string;
}
