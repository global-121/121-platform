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
import { FspName } from '../../fsp/enum/fsp-name.enum';
import { ProgramPhase } from '../../shared/enum/program-phase.enum';
import {
  CreateProgramCustomAttributeDto,
  CustomAttributeType,
} from './create-program-custom-attribute.dto';
import { CreateProgramQuestionDto } from './program-question.dto';

export class SetFspDto {
  @ApiProperty()
  @IsEnum(FspName)
  fsp: FspName;
}

export class CreateProgramDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  public readonly published: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  public readonly validation: boolean;

  @ApiProperty({ example: ProgramPhase.design })
  @IsEnum(ProgramPhase)
  public readonly phase: ProgramPhase;

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
  public readonly titlePortal: JSON;

  @ApiProperty({ example: { en: 'title' } })
  @IsNotEmpty()
  public readonly titlePaApp: JSON;

  @ApiProperty({ example: { en: 'description' } })
  @IsOptional()
  public readonly description?: JSON;

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
        fsp: FspName.intersolveVoucherWhatsapp,
      },
      {
        fsp: FspName.intersolveVoucherPaper,
      },
    ],
    description: 'Use the GET /fsp endpoint to find valid fspNames.',
  })
  @IsArray()
  @ValidateNested()
  @IsDefined()
  @Type(() => SetFspDto)
  public readonly financialServiceProviders: SetFspDto[];

  @ApiProperty({ example: 250 })
  @IsNumber()
  public readonly targetNrRegistrations: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  public readonly tryWhatsAppFirst: boolean;

  @ApiProperty({
    example: { en: 'Identity card;Health Insurance;Proof of children' },
  })
  public readonly meetingDocuments: JSON;

  @ApiProperty({ example: '+000 000 00 00' })
  @IsString()
  public readonly phoneNumberPlaceholder: string;

  @ApiProperty({
    example: [
      {
        name: 'nameParterOrganization',
        type: CustomAttributeType.text,
        label: { en: 'Name partner organization' },
        export: [
          'all-people-affected',
          'included',
          'selected-for-validation',
          'payment',
        ],
        phases: ['registrationValidation', 'inclusion', 'payment'],
      },
      {
        name: 'exampleBoolean',
        type: CustomAttributeType.boolean,
        label: { en: 'Example boolean' },
        export: [
          'all-people-affected',
          'included',
          'selected-for-validation',
          'payment',
        ],
        phases: ['registrationValidation', 'inclusion', 'payment'],
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
        label: {
          en: 'What is your first name?',
        },
        answerType: 'text',
        questionType: 'standard',
        options: null,
        persistence: true,
        export: ['all-people-affected', 'included', 'selected-for-validation'],
        scoring: {},
        phases: [],
        editableInPortal: false,
        shortLabel: {
          en: 'First Name',
        },
      },
      {
        name: 'nameLast',
        label: {
          en: 'What is your last name?',
        },
        answerType: 'text',
        questionType: 'standard',
        options: null,
        persistence: true,
        export: ['all-people-affected', 'included', 'selected-for-validation'],
        scoring: {},
        phases: [],
        editableInPortal: false,
        shortLabel: {
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
        phases: [],
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
        phases: [],
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
  public readonly aboutProgram: JSON;

  @ApiProperty({
    example: ['nameFirst', 'nameLast'],
    description: 'Should be array of name-related program-questions.',
  })
  @IsArray()
  public readonly fullnameNamingConvention: JSON;

  @ApiProperty({ example: ['en', 'nl'] })
  @IsArray()
  public readonly languages: JSON;

  @ApiProperty({ example: true })
  @IsBoolean()
  public readonly enableMaxPayments: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  public readonly enableScope: boolean;

  @ApiProperty({ example: 'example.org' })
  @IsOptional()
  public evaluationDashboardUrl?: string;

  @ApiProperty({ example: 'example.org' })
  @IsOptional()
  public monitoringDashboardUrl?: string;
}
