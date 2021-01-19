import { ApiModelProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsIn,
  ValidateIf,
  ValidateNested,
  IsDefined,
} from 'class-validator';
import { CreateOptionsDto } from './create-options.dto';
import { Type } from 'class-transformer';

export class CreateCustomCriteriumDto {
  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  public readonly criterium: string;
  @ApiModelProperty()
  @IsNotEmpty()
  public readonly label: JSON;
  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  @IsIn(['numeric', 'dropdown', 'text', 'date', 'tel'])
  public readonly answerType: string;
  @ApiModelProperty()
  @IsNotEmpty()
  public readonly criteriumType: string;
  @ApiModelProperty()
  @ValidateIf(o => o.answerType === 'dropdown')
  @ValidateNested()
  @IsDefined()
  @Type(() => CreateOptionsDto)
  public readonly options: JSON;
  @ApiModelProperty()
  @IsNotEmpty()
  public readonly scoring: JSON;
  public readonly persistence: boolean;
}
