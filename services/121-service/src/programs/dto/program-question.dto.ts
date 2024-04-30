import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ExportType } from '../../metrics/dto/export-details.dto';
import { AnswerTypes } from '../../registration/enum/custom-data-attributes';
import { ProgramPhase } from '../../shared/enum/program-phase.enum';
import { CreateOptionsDto } from './create-options.dto';

class BaseProgramQuestionDto {
  @ApiProperty({})
  @IsNotEmpty()
  @IsString()
  public readonly name: string;

  @ApiProperty({ required: false })
  @ValidateIf((o) => o.answerType === AnswerTypes.dropdown)
  @ValidateNested()
  @IsOptional()
  @Type(() => CreateOptionsDto)
  public readonly options: JSON;
  @ApiProperty()
  @IsOptional()
  public readonly scoring: JSON;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  public readonly persistence: boolean;
  @ApiProperty({ required: false })
  @IsOptional()
  public pattern: string;
  @ApiProperty({
    example: [
      ProgramPhase.registrationValidation,
      ProgramPhase.inclusion,
      ProgramPhase.payment,
    ],
    required: false,
  })
  @IsOptional()
  public phases: JSON;
  @ApiProperty({ example: true })
  @IsOptional()
  public readonly editableInPortal: boolean;
  @ApiProperty({
    example: [ExportType.allPeopleAffected, ExportType.included],
    required: false,
  })
  @IsOptional()
  @IsEnum(ExportType, { each: true }) // Use @IsEnum decorator to validate each element
  public readonly export: ExportType[];
  @ApiProperty({
    example: {
      en: '+31 6 00 00 00 00',
    },
    required: false,
  })
  @IsOptional()
  public placeholder: JSON;
  @ApiProperty({
    example: false,
    required: false,
  })
  @IsOptional()
  public duplicateCheck: boolean;
}

export class CreateProgramQuestionDto extends BaseProgramQuestionDto {
  @ApiProperty({
    example: {
      en: 'Please enter your last name:',
      fr: "Remplissez votre nom, s'il vous plaît:",
    },
  })
  public readonly label: JSON;

  @ApiProperty({
    example: AnswerTypes.text,
  })
  @IsString()
  @IsIn([
    AnswerTypes.numeric,
    AnswerTypes.dropdown,
    AnswerTypes.tel,
    AnswerTypes.text,
    AnswerTypes.date,
  ])
  public readonly answerType: string;

  @ApiProperty({ example: 'standard' })
  @IsIn(['standard', 'custom'])
  public readonly questionType: string;
}

export class UpdateProgramQuestionDto extends BaseProgramQuestionDto {
  @ApiProperty({
    example: {
      en: 'Please enter your last name:',
      fr: "Remplissez votre nom, s'il vous plaît:",
    },
    required: false,
  })
  @IsOptional()
  public readonly label: JSON;

  @ApiProperty({
    example: AnswerTypes.numeric,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn([
    AnswerTypes.numeric,
    AnswerTypes.dropdown,
    AnswerTypes.tel,
    AnswerTypes.text,
    AnswerTypes.date,
  ])
  public readonly answerType: AnswerTypes;

  @ApiProperty({ example: 'standard', required: false })
  @IsIn(['standard', 'custom'])
  @IsOptional()
  public readonly questionType: string;
}
