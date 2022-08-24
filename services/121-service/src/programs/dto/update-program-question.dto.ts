import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsIn,
  ValidateIf,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { CreateOptionsDto } from './create-options.dto';
import { Type } from 'class-transformer';
import { AnswerTypes } from '../../registration/enum/custom-data-attributes';
import { ProgramPhase } from '../../shared/enum/program-phase.model';

export class UpdateProgramQuestionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public readonly name: string;
  @ApiProperty()
  @IsOptional()
  public readonly label: JSON;
  @ApiProperty()
  @IsOptional()
  @IsString()
  @IsIn([
    AnswerTypes.numeric,
    AnswerTypes.dropdown,
    AnswerTypes.tel,
    AnswerTypes.text,
    AnswerTypes.date,
  ])
  public readonly answerType: string;
  @ApiProperty()
  @IsOptional()
  public readonly questionType: string;
  @ApiProperty()
  @ValidateIf(o => o.answerType === AnswerTypes.dropdown)
  @ValidateNested()
  @IsOptional()
  @Type(() => CreateOptionsDto)
  public readonly options: JSON;
  @ApiProperty()
  @IsOptional()
  public readonly scoring: JSON;
  @ApiProperty()
  @IsOptional()
  public readonly persistence: boolean;
  @ApiProperty()
  @IsOptional()
  public pattern: string;
  @ApiProperty({
    example: [
      ProgramPhase.registrationValidation,
      ProgramPhase.inclusion,
      ProgramPhase.payment,
    ],
  })
  @IsOptional()
  public phases: JSON;
  @ApiProperty()
  @IsOptional()
  public readonly editableInPortal: boolean;
}
