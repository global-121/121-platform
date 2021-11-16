import { ApiModelProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsIn,
  ValidateIf,
  ValidateNested,
  IsDefined,
} from 'class-validator';
import { CreateOptionsDto } from './create-options.dto';
import { Type } from 'class-transformer';
import { AnswerTypes } from '../../registration/enum/custom-data-attributes';

export class CreateProgramQuestionDto {
  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  public readonly name: string;
  @ApiModelProperty()
  @IsNotEmpty()
  public readonly label: JSON;
  @ApiModelProperty()
  @IsNotEmpty()
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
  @IsNotEmpty()
  public readonly questionType: string;
  @ApiModelProperty()
  @ValidateIf(o => o.answerType === AnswerTypes.dropdown)
  @ValidateNested()
  @IsDefined()
  @Type(() => CreateOptionsDto)
  public readonly options: JSON;
  @ApiModelProperty()
  @IsNotEmpty()
  public readonly scoring: JSON;
  @ApiModelProperty()
  @IsNotEmpty()
  public readonly persistence: boolean;
  @ApiModelProperty()
  @IsNotEmpty()
  public readonly pattern: string;
}
