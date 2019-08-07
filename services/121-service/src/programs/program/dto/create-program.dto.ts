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
  @ApiModelProperty({ example: '2020-05-23T18:25:43.511Z' })
  @IsNotEmpty()
  @IsDateString()
  public readonly startDate: Date;
  @ApiModelProperty({ example: '2020-05-23T18:25:43.511Z' })
  @IsNotEmpty()
  @IsDateString()
  public readonly endDate: Date;
  @ApiModelProperty({ example: 'MWK' })
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
  @ApiModelProperty({ example: 'standard' })
  @IsIn(['standard'])
  public readonly inclusionCalculationType: string;
  @ApiModelProperty({
    example: [
      {
        criterium: 'nr_of_children',
        question: {
          english: 'How many children do you have?',
          nyanja: 'Zaka zanu ndi zingati?',
        },
        answerType: 'numeric',
        criteriumType: 'standard',
        options: null,
        scoring: {
          '0-18': 999,
          '19-65': 0,
          '65>': 6,
        },
      },
      {
        criterium: 'roof_type',
        question: {
          english: 'What type is your roof?',
          nyanja: 'Denga lanu ndi lotani?',
        },
        answerType: 'dropdown',
        criteriumType: 'standard',
        options: {
          options: [
            {
              id: 0,
              option: 'steel',
              name: {
                english: 'steel',
                nyanja: 'zitsulo',
              },
            },
            {
              id: 1,
              option: 'tiles',
              name: {
                english: 'tiles',
                nyanja: 'matayala',
              },
            },
          ],
        },
        scoring: {
          '0': 3,
          '1': 6,
        },
      },
    ],
  })
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
