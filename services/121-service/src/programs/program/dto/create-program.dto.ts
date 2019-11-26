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
import { FinancialServiceProviderEntity } from '../financial-service-provider.entity';
import { ProtectionServiceProviderEntity } from '../protection-service-provider.entity';

export class CreateProgramDto {
  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  public readonly location: string;

  @ApiModelProperty({ example: { en: 'title' } })
  @IsNotEmpty()
  public readonly title: JSON;

  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  public readonly ngo: string;

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
  @IsNumber()
  public readonly distributionDuration: number;

  @ApiModelProperty({ example: [500, 500, 500] })
  // @IsArray()
  public readonly fixedTransferValue: JSON;

  @ApiModelProperty({
    example: [
      {
        id: 1
      },
      {
        id: 2
      },
    ],
  })
  @IsArray()
  @ValidateNested()
  @IsDefined()
  @Type(() => FinancialServiceProviderEntity)
  public readonly financialServiceProviders: FinancialServiceProviderEntity[];

  @ApiModelProperty({
    example: [
      {
        id: 1
      },
      {
        id: 2
      },
    ],
  })
  @IsArray()
  @ValidateNested()
  @IsDefined()
  @Type(() => ProtectionServiceProviderEntity)
  public readonly protectionServiceProviders: ProtectionServiceProviderEntity[];

  @ApiModelProperty({ example: 'minimumScore' })
  @IsIn(['minimumScore', 'highestScoresX'])
  public readonly inclusionCalculationType: string;

  @ApiModelProperty()
  @IsNumber()
  public readonly minimumScore: number;

  @ApiModelProperty()
  @IsNumber()
  public readonly highestScoresX: number;

  @ApiModelProperty({
    example: { en: 'Identity card;Health Insurance;Proof of children' },
  })
  public readonly meetingDocuments: JSON;

  @ApiModelProperty({
    example: {
      en: {
        included: "You have been included in this program please wait for further instructions",
        excluded: "Unfortunately you have not been included for this program"
      },
      nl: {
        included: "Je zit wel in het programma",
        excluded: "Je zit niet in het programma"
      },
    }
  })
  public readonly notifications: JSON;

  @ApiModelProperty({
    example: [
      {
        criterium: 'nr_of_children',
        label: {
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
        label: {
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

  @ApiModelProperty({ example: { en: 'description' } })
  public readonly description: JSON;

  @ApiModelProperty({ example: { en: 'descLocation' } })
  public readonly descLocation: JSON;

  @ApiModelProperty({ example: { en: 'descHumanitarianObjective' } })
  public readonly descHumanitarianObjective: JSON;

  @ApiModelProperty({ example: { en: 'descCashType' } })
  public readonly descCashType: JSON;

  @ApiModelProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  public readonly countryId: number;
}
