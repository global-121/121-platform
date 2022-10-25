import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDefined,
  IsIn,
  IsNotEmpty,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { AnswerTypes } from '../../registration/enum/custom-data-attributes';
import { ProgramPhase } from '../../shared/enum/program-phase.model';
import { CreateOptionsDto } from './create-options.dto';

export class CreateProgramQuestionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public readonly name: string;
  @ApiProperty()
  @IsNotEmpty()
  public readonly label: JSON;
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsIn([
    AnswerTypes.numeric,
    AnswerTypes.dropdown,
    AnswerTypes.tel,
    AnswerTypes.text,
    AnswerTypes.date,
    AnswerTypes.multiSelect,
  ])
  public readonly answerType: string;
  @ApiProperty()
  @IsNotEmpty()
  public readonly questionType: string;
  @ApiProperty()
  @ValidateIf(o => o.answerType === AnswerTypes.dropdown)
  @ValidateNested()
  @IsDefined()
  @Type(() => CreateOptionsDto)
  public readonly options: JSON;
  @ApiProperty()
  @IsNotEmpty()
  public readonly scoring: JSON;
  @ApiProperty()
  @IsNotEmpty()
  public readonly persistence: boolean;
  @ApiProperty()
  @IsNotEmpty()
  public readonly pattern: string;
  @ApiProperty({
    example: [
      ProgramPhase.registrationValidation,
      ProgramPhase.inclusion,
      ProgramPhase.payment,
    ],
  })
  @IsNotEmpty()
  public phases: JSON;
  @ApiProperty()
  @IsNotEmpty()
  public readonly editableInPortal: boolean;
}
