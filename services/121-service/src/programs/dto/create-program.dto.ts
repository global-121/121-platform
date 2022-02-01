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
import { CreateProgramQuestionDto } from './create-program-question.dto';
import { Type } from 'class-transformer';
import { FinancialServiceProviderEntity } from '../../fsp/financial-service-provider.entity';
import {
  CreateProgramCustomAttributeDto,
  CustomAttributeType,
} from './create-program-custom-attribute.dto';

export class CreateProgramDto {
  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  public readonly location: string;

  @ApiModelProperty({ example: { en: 'title' } })
  @IsNotEmpty()
  public readonly titlePortal: JSON;

  @ApiModelProperty({ example: { en: 'title' } })
  @IsNotEmpty()
  public readonly titlePaApp: JSON;

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

  @ApiModelProperty({ example: 500 })
  public readonly fixedTransferValue: number;

  @ApiModelProperty({
    example: [
      {
        id: 1,
      },
      {
        id: 2,
      },
    ],
  })
  @IsArray()
  @ValidateNested()
  @IsDefined()
  @Type(() => FinancialServiceProviderEntity)
  public readonly financialServiceProviders: FinancialServiceProviderEntity[];

  @ApiModelProperty({ example: 'minimumScore' })
  @IsIn(['minimumScore', 'highestScoresX'])
  public readonly inclusionCalculationType: string;

  @ApiModelProperty()
  @IsNumber()
  public readonly minimumScore: number;

  @ApiModelProperty()
  @IsNumber()
  public readonly highestScoresX: number;

  @ApiModelProperty()
  @IsBoolean()
  public readonly validation: boolean;

  @ApiModelProperty()
  @IsBoolean()
  public readonly validationByQr: boolean;

  @ApiModelProperty({
    example: { en: 'Identity card;Health Insurance;Proof of children' },
  })
  public readonly meetingDocuments: JSON;

  @ApiModelProperty({
    example: {
      en: {
        included: 'You have been included in this program.',
        rejected:
          'Unfortunately we have to inform you that you will not receive any (more) payments for this program. If you have questions, please contact us.',
      },
      nl: {
        included: 'Je zit wel in het programma',
        rejected: 'Je zit niet in het programma',
      },
    },
  })
  public readonly notifications: JSON;

  @ApiModelProperty({ example: '+000 000 00 00' })
  @IsString()
  public readonly phoneNumberPlaceholder: string;

  @ApiModelProperty({
    example: [
      {
        name: 'nameParterOrganization',
        type: CustomAttributeType.string,
      },
      {
        name: 'exampleBoolean',
        type: CustomAttributeType.boolean,
      },
    ],
  })
  @IsArray()
  @ValidateNested()
  @IsDefined()
  @Type(() => CreateProgramCustomAttributeDto)
  public readonly programCustomAttributes: CreateProgramCustomAttributeDto[];

  @ApiModelProperty({
    example: [
      {
        name: 'id_number',
        label: {
          en: 'What is your id number?',
          ny: 'Zaka zanu ndi id?',
        },
        answerType: 'numeric',
        questionType: 'standard',
        options: null,
        persistence: true,
        scoring: {},
      },
      {
        name: 'nr_of_children',
        label: {
          en: 'How many children do you have?',
          ny: 'Zaka zanu ndi zingati?',
        },
        answerType: 'numeric',
        questionType: 'standard',
        options: null,
        scoring: {
          '0-18': 999,
          '19-65': 0,
          '65>': 6,
        },
      },
      {
        name: 'roof_type',
        label: {
          en: 'What type is your roof?',
          ny: 'Denga lanu ndi lotani?',
        },
        answerType: 'dropdown',
        questionType: 'standard',
        options: {
          options: [
            {
              id: 0,
              option: 'steel',
              name: {
                en: 'steel',
                ny: 'zitsulo',
              },
            },
            {
              id: 1,
              option: 'tiles',
              name: {
                en: 'tiles',
                ny: 'matayala',
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
  @Type(() => CreateProgramQuestionDto)
  public readonly programQuestions: CreateProgramQuestionDto[];

  @ApiModelProperty({ example: { en: 'description' } })
  public readonly description: JSON;

  @ApiModelProperty({ example: { en: 'descCashType' } })
  public readonly descCashType: JSON;
}
