import { ProgramAnswer } from './../../../registration/dto/store-program-answers.dto';
import {
  Length,
  IsNotEmpty,
  IsString,
  IsNumber,
  IsArray,
} from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export class AttributeDto {
  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  public readonly attributeId: number;
  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  public readonly attribute: string;
  @ApiModelProperty()
  @IsNotEmpty()
  @IsNumber()
  public readonly answer: string;
}

export class ValidationIssueDataDto {
  @ApiModelProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  public readonly referenceId: string;
  @ApiModelProperty({
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
