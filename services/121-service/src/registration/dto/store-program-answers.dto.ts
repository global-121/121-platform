import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { IsRegistrationDataValidType } from '../validator/registration-data-type.validator';

export class ProgramAnswer {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public readonly programQuestionName: string;
  @ApiProperty()
  @IsRegistrationDataValidType({
    referenceId: 'referenceId',
    attribute: 'programQuestionName',
  })
  public programAnswer: string | string[];
}

export class StoreProgramAnswersDto {
  @ApiProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  public readonly referenceId: string;
  @ApiProperty({
    example: {
      referenceId: '910c50be-f131-4b53-b06b-6506a40a2734',
      programAnswers: [
        {
          programQuestionName: 'name',
          programAnswer: 'example',
        },
      ],
    },
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramAnswer)
  public readonly programAnswers: ProgramAnswer[];
}
