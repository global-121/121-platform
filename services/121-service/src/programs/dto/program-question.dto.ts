import { ExportType } from '@121-service/src/metrics/dto/export-details.dto';
import { CreateOptionsDto } from '@121-service/src/programs/dto/create-options.dto';
import { AnswerTypes } from '@121-service/src/registration/enum/custom-data-attributes';
import { LocalizedString } from '@121-service/src/shared/enum/language.enums';
import { QuestionOption } from '@121-service/src/shared/enum/question.enums';
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
  public readonly options?: QuestionOption[];
  @ApiProperty()
  @IsOptional()
  public readonly scoring?: Record<string, unknown>;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  public readonly persistence?: boolean;
  @ApiProperty({ required: false })
  @IsOptional()
  public pattern?: string;
  @ApiProperty({
    example: false,
  })
  @IsOptional()
  public showInPeopleAffectedTable: boolean;
  @ApiProperty({ example: true })
  @IsOptional()
  public readonly editableInPortal?: boolean;
  @ApiProperty({
    example: [ExportType.allPeopleAffected, ExportType.included],
    required: false,
  })
  @IsOptional()
  @IsEnum(ExportType, { each: true }) // Use @IsEnum decorator to validate each element
  public readonly export?: ExportType[];
  @ApiProperty({
    example: {
      en: '+31 6 00 00 00 00',
    },
    required: false,
  })
  @IsOptional()
  public placeholder?: LocalizedString;
  @ApiProperty({
    example: false,
    required: false,
  })
  @IsOptional()
  public duplicateCheck?: boolean;
}

export class CreateProgramQuestionDto extends BaseProgramQuestionDto {
  @ApiProperty({
    example: {
      en: 'Please enter your last name:',
      fr: "Remplissez votre nom, s'il vous plaît:",
    },
  })
  public readonly label: LocalizedString;

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
  public readonly label?: LocalizedString;

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
  public readonly answerType?: AnswerTypes;

  @ApiProperty({ example: 'standard', required: false })
  @IsIn(['standard', 'custom'])
  @IsOptional()
  public readonly questionType?: string;
}
