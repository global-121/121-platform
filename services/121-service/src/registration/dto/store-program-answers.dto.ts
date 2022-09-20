import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
} from 'class-validator';

export class ProgramAnswer {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public readonly programQuestionName: string;
  @ApiProperty()
  @IsNotEmpty()
  public programAnswer: string | string[];
}

export class StoreProgramAnswersDto {
  @ApiProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  public readonly referenceId: string;
  @ApiProperty()
  @IsArray()
  public readonly programAnswers: ProgramAnswer[];
}
