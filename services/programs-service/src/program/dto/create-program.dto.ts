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
  IsInstance,
  ValidateNested,
  IsDefined,
} from 'class-validator';
import { CreateCustomCriteriumDto } from './create-custom-criterium.dto';
import { Type } from 'class-transformer';

export class CreateProgramDto {
  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  public readonly location: string;
  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  public readonly title: string;
  @ApiModelProperty()
  @IsNotEmpty()
  @IsDateString()
  public readonly startDate: Date;
  @ApiModelProperty()
  @IsNotEmpty()
  @IsDateString()
  public readonly endDate: Date;
  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  @Length(3, 3, {
    message: 'Currency should be a 3 letter abbreviation',
  })
  public readonly currency: string;
  @ApiModelProperty()
  @IsString()
  public readonly distributionFrequency: string;
  @ApiModelProperty()
  @IsString()
  public readonly distributionChannel: string;
  @ApiModelProperty()
  @IsBoolean()
  public readonly notifiyPaArea: boolean;
  @ApiModelProperty()
  @IsString()
  public readonly notificationType: string;
  @ApiModelProperty()
  public readonly cashDistributionSites: JSON;
  @ApiModelProperty()
  public readonly financialServiceProviders: JSON;
  @ApiModelProperty()
  @IsIn(['standard'])
  public readonly inclusionCalculationType: string;
  @ApiModelProperty()
  @IsArray()
  @ValidateNested()
  @IsDefined()
  @Type(() => CreateCustomCriteriumDto)
  public readonly customCriteria: CreateCustomCriteriumDto[];
  @ApiModelProperty()
  @IsNumber()
  public readonly minimumScore: number;
  @ApiModelProperty()
  @IsString()
  public readonly description: string;
  @ApiModelProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  public readonly countryId: number;
}
