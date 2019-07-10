import { ApiModelProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsDateString, IsNumber } from 'class-validator';

export class CreateCustomCriteriumDto {
  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  public readonly criterium: string;
  @ApiModelProperty()
  @IsNotEmpty()
  public readonly question: JSON;
  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  public readonly answerType: string;
  @ApiModelProperty()
  @IsNotEmpty()
  public readonly criteriumType: string;
  @ApiModelProperty()
  public readonly options: JSON;
  @ApiModelProperty()
  @IsNotEmpty()
  public readonly scoring: JSON;
}
