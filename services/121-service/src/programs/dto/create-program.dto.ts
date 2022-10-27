import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsDefined,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { FinancialServiceProviderEntity } from '../../fsp/financial-service-provider.entity';
import {
  CreateProgramCustomAttributeDto,
  CustomAttributeType,
} from './create-program-custom-attribute.dto';
import { CreateProgramQuestionDto } from './create-program-question.dto';

export class CreateProgramDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public readonly location: string;

  @ApiProperty({ example: { en: 'title' } })
  @IsNotEmpty()
  public readonly titlePortal: JSON;

  @ApiProperty({ example: { en: 'title' } })
  @IsNotEmpty()
  public readonly titlePaApp: JSON;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public readonly ngo: string;

  @ApiProperty({ example: '2020-05-23T18:25:43.511Z' })
  @IsNotEmpty()
  @IsDateString()
  public readonly startDate: Date;

  @ApiProperty({ example: '2020-05-23T18:25:43.511Z' })
  @IsNotEmpty()
  @IsDateString()
  public readonly endDate: Date;

  @ApiProperty({ example: 'MWK' })
  @IsNotEmpty()
  @IsString()
  @Length(3, 3, {
    message: 'Currency should be a 3 letter abbreviation',
  })
  public readonly currency: string;

  @ApiProperty()
  @IsString()
  public readonly distributionFrequency: string;

  @ApiProperty()
  @IsNumber()
  public readonly distributionDuration: number;

  @ApiProperty({ example: 500 })
  public readonly fixedTransferValue: number;

  @ApiProperty({ example: '0 + 1 * nrOfHouseHoldMembers' })
  @IsOptional()
  @IsString()
  public readonly paymentAmountMultiplierFormula: string;

  @ApiProperty({
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

  @ApiProperty({ example: 'minimumScore' })
  @IsIn(['minimumScore', 'highestScoresX'])
  public readonly inclusionCalculationType: string;

  @ApiProperty()
  @IsNumber()
  public readonly minimumScore: number;

  @ApiProperty()
  @IsNumber()
  public readonly highestScoresX: number;

  @ApiProperty()
  @IsBoolean()
  public readonly validation: boolean;

  @ApiProperty({
    example: { en: 'Identity card;Health Insurance;Proof of children' },
  })
  public readonly meetingDocuments: JSON;

  @ApiProperty({
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

  @ApiProperty({ example: '+000 000 00 00' })
  @IsString()
  public readonly phoneNumberPlaceholder: string;

  @ApiProperty({
    example: [
      {
        name: 'nameParterOrganization',
        type: CustomAttributeType.text,
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

  @ApiProperty({
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
        editableInPortal: false,
        phases: [],
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
        phases: [],
        editableInPortal: false,
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

  @ApiProperty({ example: { en: 'description' } })
  public readonly description: JSON;

  @ApiProperty({ example: { en: 'descCashType' } })
  public readonly descCashType: JSON;
}
