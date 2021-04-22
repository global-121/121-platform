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
  @ApiModelProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  public readonly referenceId: string;
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
