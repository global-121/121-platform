import { ApiModelProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsDateString,
  Length,
  IsBoolean,
  IsIn,
  IsArray,
  IsNumber,
  ValidateNested,
  IsDefined,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAvailabilityDto {
  @ApiModelProperty({ example: '2020-05-23T09:00:00.511Z' })
  @IsNotEmpty()
  @IsDateString()
  public readonly startDate: Date;
  @ApiModelProperty({ example: '2020-05-23T17:00:00.511Z' })
  @IsNotEmpty()
  @IsDateString()
  public readonly endDate: Date;
  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  public readonly location: string;
}
