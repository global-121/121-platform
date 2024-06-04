import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { ExportType } from '@121-service/src/metrics/dto/export-details.dto';
import {
  CreateProgramCustomAttributeDto,
  CustomAttributeType,
} from '@121-service/src/programs/dto/create-program-custom-attribute.dto';
import { CreateProgramQuestionDto } from '@121-service/src/programs/dto/program-question.dto';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';
import { WrapperType } from '@121-service/src/wrapper.type';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';

import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';

export class ProgramFinancialServiceProviderDto {
  @ApiProperty()
  @IsEnum(FinancialServiceProviderName)
  fsp: WrapperType<FinancialServiceProviderName>;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  configuration?: {
    name: string;
    value: string | string[] | Record<string, string>;
  }[];
}

export class CreateProgramDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  public readonly published: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  public readonly validation: boolean;

  @ApiProperty({ example: 'Nederland' })
  @IsNotEmpty()
  @IsString()
  public readonly location: string;

  @ApiProperty({ example: 'NLRC' })
  @IsNotEmpty()
  @IsString()
  public readonly ngo: string;

  @ApiProperty({ example: { en: 'title' } })
  @IsNotEmpty()
  public readonly titlePortal: LocalizedString;

  @ApiProperty({ example: { en: 'description' } })
  @IsOptional()
  public readonly description?: LocalizedString;

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

  @ApiProperty({ example: 'week', enum: ['week', 'month'] })
  @IsString()
  public readonly distributionFrequency: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  public readonly distributionDuration: number;

  @ApiProperty({ example: 500 })
  public readonly fixedTransferValue: number;

  @ApiProperty({ example: '0 + 1 * nrOfHouseHoldMembers' })
  @IsOptional()
  @IsString()
  public readonly paymentAmountMultiplierFormula?: string;

  @ApiProperty({
    example: [
      {
        fsp: FinancialServiceProviderName.intersolveVoucherWhatsapp,
      },
      {
        fsp: FinancialServiceProviderName.intersolveVoucherPaper,
      },
    ],
    description:
      'Use the GET /financial-service-providers endpoint to find valid fspNames.',
  })
  @IsArray()
  @ValidateNested()
  @IsDefined()
  @Type(() => ProgramFinancialServiceProviderDto)
  public readonly financialServiceProviders: ProgramFinancialServiceProviderDto[];

  @ApiProperty({ example: 250 })
  @IsNumber()
  public readonly targetNrRegistrations: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  public readonly tryWhatsAppFirst: boolean;

  @ApiProperty({
    example: [
      {
        name: 'nameParterOrganization',
        type: CustomAttributeType.text,
        label: { en: 'Name partner organization' },
        export: [
          ExportType.allPeopleAffected,
          ExportType.included,
          ExportType.payment,
        ],
        showInPeopleAffectedTable: true,
      },
      {
        name: 'exampleBoolean',
        type: CustomAttributeType.boolean,
        label: { en: 'Example boolean' },
        export: [
          ExportType.allPeopleAffected,
          ExportType.included,
          ExportType.payment,
        ],
        showInPeopleAffectedTable: true,
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
        name: 'nameFirst',
        answerType: 'text',
        questionType: 'standard',
        options: null,
        persistence: true,
        export: [ExportType.allPeopleAffected, ExportType.included],
        scoring: {},
        showInPeopleAffectedTable: true,
        editableInPortal: false,
        label: {
          en: 'First Name',
        },
      },
      {
        name: 'nameLast',
        answerType: 'text',
        questionType: 'standard',
        options: null,
        persistence: true,
        export: [ExportType.allPeopleAffected, ExportType.included],
        scoring: {},
        showInPeopleAffectedTable: true,
        editableInPortal: false,
        label: {
          en: 'Last Name',
        },
      },
      {
        name: 'nr_of_children',
        label: {
          en: 'How many children do you have?',
        },
        answerType: 'numeric',
        questionType: 'standard',
        options: null,
        scoring: {
          '0-18': 999,
          '19-65': 0,
          '65>': 6,
        },
        showInPeopleAffectedTable: false,
        editableInPortal: false,
      },
      {
        name: 'roof_type',
        label: {
          en: 'What type is your roof?',
        },
        answerType: 'dropdown',
        questionType: 'standard',
        options: [
          {
            id: 0,
            option: 'steel',
            label: {
              en: 'Steel',
            },
          },
          {
            id: 1,
            option: 'tiles',
            label: {
              en: 'Tiles',
            },
          },
        ],
        scoring: {
          '0': 3,
          '1': 6,
        },
        showInPeopleAffectedTable: false,
        editableInPortal: true,
      },
    ],
  })
  @IsArray()
  @ValidateNested()
  @IsDefined()
  @Type(() => CreateProgramQuestionDto)
  public readonly programQuestions: CreateProgramQuestionDto[];

  @ApiProperty({ example: { en: 'about program' } })
  @IsNotEmpty()
  public readonly aboutProgram: LocalizedString;

  @ApiProperty({
    example: ['nameFirst', 'nameLast'],
    description: 'Should be array of name-related program-questions.',
  })
  @IsArray()
  public readonly fullnameNamingConvention: string[];

  @ApiProperty({ example: ['en', 'nl'] })
  @IsArray()
  public readonly languages: WrapperType<LanguageEnum[]>;

  @ApiProperty({ example: false })
  @IsBoolean()
  public readonly enableMaxPayments: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  public readonly enableScope: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  public readonly allowEmptyPhoneNumber: boolean;

  @ApiProperty({ example: 'example.org' })
  @IsOptional()
  public monitoringDashboardUrl?: string;

  @ApiProperty({ example: 100000 })
  @IsOptional()
  @IsNumber()
  public readonly budget?: number;
}
