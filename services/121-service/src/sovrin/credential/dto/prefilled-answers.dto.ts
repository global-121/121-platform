import { ApiModelProperty } from '@nestjs/swagger';
import { Length, IsNotEmpty, IsString, IsNumber, IsArray } from 'class-validator';

export class PrefilledAnswerDto {
  @ApiModelProperty({ example: 'age' })
  @IsNotEmpty()
  @IsString()
  public readonly attribute: string;
  @ApiModelProperty({ example: 32 })
  @IsNotEmpty()
  @IsNumber()
  public readonly answer: number;
}

export class PrefilledAnswersDto {
  @ApiModelProperty({
    example: [
    {
      attribute: 'Age',
      answer: 32
    },
    {
      attribute: 'RoofType',
      answer: 0
    }
    ]})
  @IsArray()
  public readonly attributes: PrefilledAnswerDto[];

}
