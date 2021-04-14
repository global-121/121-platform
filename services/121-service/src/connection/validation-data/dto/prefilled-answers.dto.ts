import { ApiModelProperty } from '@nestjs/swagger';
import {
  Length,
  IsNotEmpty,
  IsString,
  IsNumber,
  IsArray,
} from 'class-validator';

export class PrefilledAnswerDto {
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
  public answer: string;
}

export class PrefilledAnswersDto {
  @ApiModelProperty({ example: 'did:sov:exampleExampleExample' })
  @Length(29, 30)
  public readonly did: string;
  @ApiModelProperty({ example: 1 })
  public readonly programId: number;
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
  public readonly attributes: PrefilledAnswerDto[];
}
