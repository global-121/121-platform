import { ApiModelProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsIn,
  ValidateIf,
  ValidateNested,
  IsDefined,
} from 'class-validator';
import { CreateOptionsDto } from '../../program/dto/create-options.dto';
import { Type } from 'class-transformer';

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
  @ValidateNested()
  @IsDefined()
  @Type(() => CreateOptionsDto)
  public readonly options: JSON;
}
