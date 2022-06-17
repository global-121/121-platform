import { ApiModelProperty } from '@nestjs/swagger';
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
  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  public readonly name: string;
  @ApiModelProperty()
  @IsOptional()
  public readonly label: JSON;
  @ApiModelProperty()
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
  @ApiModelProperty()
  @IsOptional()
  public readonly questionType: string;
  @ApiModelProperty()
  @ValidateIf(o => o.answerType === AnswerTypes.dropdown)
  @ValidateNested()
  @IsOptional()
  @Type(() => CreateOptionsDto)
  public readonly options: JSON;
  @ApiModelProperty()
  @IsOptional()
  public readonly scoring: JSON;
  @ApiModelProperty()
  @IsOptional()
  public readonly persistence: boolean;
  @ApiModelProperty()
  @IsOptional()
  public pattern: string;
  @ApiModelProperty({
    example: [
      ProgramPhase.registrationValidation,
      ProgramPhase.inclusion,
      ProgramPhase.payment,
    ],
  })
  @IsOptional()
  public phases: JSON;
  @ApiModelProperty()
  @IsOptional()
  public readonly editableInPortal: boolean;
}
