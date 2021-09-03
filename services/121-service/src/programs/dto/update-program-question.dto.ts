import { ApiModelProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsIn,
  ValidateIf,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { CreateOptionsDto } from './create-options.dto';
import { Type } from 'class-transformer';

export class UpdateProgramQuestionDto {
  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  public readonly name: string;
  @ApiModelProperty()
  @IsOptional()
  public readonly label: JSON;
  @ApiModelProperty()
  @IsOptional()
  @IsString()
  @IsIn(['numeric', 'dropdown', 'text', 'date', 'tel'])
  public readonly answerType: string;
  @ApiModelProperty()
  @IsOptional()
  public readonly questionType: string;
  @ApiModelProperty()
  @ValidateIf(o => o.answerType === 'dropdown')
  @ValidateNested()
  @IsOptional()
  @Type(() => CreateOptionsDto)
  public readonly options: JSON;
  @ApiModelProperty()
  @IsOptional()
  public readonly scoring: JSON;
  @ApiModelProperty()
  @IsOptional()
  public readonly persistence: boolean;
  @ApiModelProperty()
  @IsOptional()
  public pattern: string;
}
