import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';

import { ProjectFspConfigurationResponseDto } from '@121-service/src/project-fsp-configurations/dtos/project-fsp-configuration-response.dto';
import { ProjectRegistrationAttributeDto } from '@121-service/src/projects/dto/project-registration-attribute.dto';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';
import { WrapperType } from '@121-service/src/wrapper.type';

// This declared at the top of the file because it is used in the dto class and else it is not defined yet
// It's not defined inline because typing works more convient here
const exampleAttributesReturn: ProjectRegistrationAttributeDto[] = [
  {
    name: 'nameFirst',
    type: RegistrationAttributeTypes.text,
    options: undefined,
    includeInTransactionExport: true,
    scoring: {},
    showInPeopleAffectedTable: true,
    editableInPortal: false,
    label: {
      en: 'First Name',
    },
  },
  {
    name: 'nameLast',
    type: RegistrationAttributeTypes.text,
    options: undefined,
    includeInTransactionExport: true,
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
    type: RegistrationAttributeTypes.numeric,
    options: undefined,
    scoring: {
      '0-18': 999,
      '19-65': 0,
      '65>': 6,
    },
    showInPeopleAffectedTable: true,
    editableInPortal: false,
  },
  {
    name: 'roof_type',
    label: {
      en: 'What type is your roof?',
    },
    type: RegistrationAttributeTypes.dropdown,
    options: [
      {
        option: 'steel',
        label: {
          en: 'Steel',
        },
      },
      {
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
    showInPeopleAffectedTable: true,
    editableInPortal: true,
  },
];
export class ProjectReturnDto {
  @ApiProperty({ example: 1, type: 'number' })
  id: number;

  @ApiProperty({ example: false })
  @IsBoolean()
  public readonly published: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  public readonly validation: boolean;

  @ApiProperty({ example: 'Nederland' })
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  public readonly location?: string;

  @ApiProperty({ example: 'NLRC' })
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  public readonly ngo?: string;

  @ApiProperty({ example: { en: 'title' } })
  @IsNotEmpty()
  @IsOptional()
  public readonly titlePortal?: LocalizedString;

  @ApiProperty({ example: { en: 'description' } })
  @IsOptional()
  public readonly description?: LocalizedString;

  @ApiProperty({ example: '2020-05-23T18:25:43.511Z' })
  @IsNotEmpty()
  @IsDateString()
  @IsOptional()
  public readonly startDate?: Date;

  @ApiProperty({ example: '2020-05-23T18:25:43.511Z' })
  @IsNotEmpty()
  @IsDateString()
  @IsOptional()
  public readonly endDate?: Date;

  @ApiProperty({ example: 'MWK' })
  @IsNotEmpty()
  @IsString()
  @Length(3, 3, {
    message: 'Currency should be a 3 letter abbreviation',
  })
  @IsOptional()
  public readonly currency?: string;

  @ApiProperty({ example: 'week', enum: ['week', 'month'] })
  @IsString()
  @IsOptional()
  public readonly distributionFrequency?: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @IsOptional()
  public readonly distributionDuration?: number;

  @ApiProperty({ example: 500 })
  @IsOptional()
  public readonly fixedTransferValue?: number;

  @ApiProperty({ example: '0 + 1 * nrOfHouseHoldMembers' })
  @IsOptional()
  @IsString()
  public readonly paymentAmountMultiplierFormula?: string;

  @ApiProperty({ example: 250 })
  @IsNumber()
  @IsOptional()
  public readonly targetNrRegistrations?: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  public readonly tryWhatsAppFirst: boolean;

  @ApiProperty({
    example: exampleAttributesReturn,
  })
  @IsArray()
  @ValidateNested()
  @IsDefined()
  @Type(() => ProjectRegistrationAttributeDto)
  public readonly projectRegistrationAttributes: ProjectRegistrationAttributeDto[];

  @ApiProperty({ example: { en: 'about project' } })
  @IsNotEmpty()
  @IsOptional()
  public readonly aboutProject?: LocalizedString;

  @ApiProperty({
    example: ['nameFirst', 'nameLast'],
    description:
      'Should be array of name-related project-registration-attributes.',
  })
  @IsArray()
  @IsOptional()
  public readonly fullnameNamingConvention?: string[];

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

  @ApiProperty()
  @IsArray()
  public readonly fspConfigurations: ProjectFspConfigurationResponseDto[];

  @ApiProperty({ example: 'example.org' })
  @IsOptional()
  public monitoringDashboardUrl?: string;

  @ApiProperty({ example: 100000 })
  @IsOptional()
  @IsNumber()
  public readonly budget?: number;
}
