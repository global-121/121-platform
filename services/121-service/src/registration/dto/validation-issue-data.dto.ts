import {
  Length,
  IsNotEmpty,
  IsString,
  IsNumber,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProgramAnswer } from './store-program-answers.dto';

export class AttributeDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public readonly attributeId: number;
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public readonly attribute: string;
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  public readonly answer: string;
}

export class ValidationIssueDataDto {
  @ApiProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  public readonly referenceId: string;
  @ApiProperty({
    example: [
      {
        attributeId: 1,
        attribute: 'nr_of_children',
        answer: 32,
      },
      {
        attributeId: 2,
        attribute: 'roof_type',
        answer: 0,
      },
    ],
  })
  @IsArray()
  public readonly programAnswers: ProgramAnswer[];
}
