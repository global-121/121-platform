import { ApiModelProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsIn, ValidateIf } from 'class-validator';

export class CreateStandardCriteriumDto {
  @ApiModelProperty({ example: 'test' })
  @IsNotEmpty()
  @IsString()
  public readonly criterium: string;
  @ApiModelProperty({
    example: {
      question: {
        english: 'What is your age?',
        nyanja: 'Zaka zanu ndi zingati?',
      },
    },
  })
  @IsNotEmpty()
  public readonly question: JSON;
  @ApiModelProperty({ example: 'numeric' })
  @IsIn(['numeric', 'dropdown'])
  public readonly answerType: string;
  @ApiModelProperty({ example: 'standard' })
  @IsIn(['standard'])
  public readonly criteriumType: string;
  @ApiModelProperty()
  @ValidateIf(o => o.answerType === 'dropdown')
  @IsNotEmpty()
  public readonly options: JSON;
}
