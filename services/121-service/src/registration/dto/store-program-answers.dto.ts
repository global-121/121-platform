import { ApiModelProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
} from 'class-validator';

export class ProgramAnswer {
  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  public readonly programQuestionName: string;
  @ApiModelProperty()
  @IsNotEmpty()
  @IsNumber()
  public programAnswer: string;
}

export class StoreProgramAnswersDto {
  @ApiModelProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  public readonly referenceId: string;
  @ApiModelProperty()
  @IsArray()
  public readonly programAnswers: ProgramAnswer[];
}
