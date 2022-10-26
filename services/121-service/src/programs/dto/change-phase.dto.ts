import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ProgramPhase } from '../../shared/enum/program-phase.model';

export class ChangePhaseDto {
  @ApiProperty({
    enum: ProgramPhase,
    example: ProgramPhase.registrationValidation,
  })
  @IsNotEmpty()
  @IsString()
  @IsEnum(ProgramPhase)
  public readonly newPhase: ProgramPhase;
}
