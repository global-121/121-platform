import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';

import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import { BaseProgramDto } from '@121-service/src/programs/dto/base-program.dto';
import { ProgramRegistrationAttributeDto } from '@121-service/src/programs/dto/program-registration-attribute.dto';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';
import { WrapperType } from '@121-service/src/wrapper.type';

// This declared at the top of the file because it is used in the CreateProgramDto and else it is not defined yet
// It's not defined inline because typing works more convenient here
const exampleAttributes: ProgramRegistrationAttributeDto[] = [
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
    showInPeopleAffectedTable: false,
    editableInPortal: false,
    isRequired: true,
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
    showInPeopleAffectedTable: false,
    editableInPortal: true,
  },
];

// See UpdateProgramDto for fields that differ in validation rules.
export class CreateProgramDto extends BaseProgramDto {
  @ApiProperty({ example: { en: 'title' } })
  @IsNotEmpty()
  public readonly titlePortal: UILanguageTranslation;

  @ApiProperty({ example: 'MWK' })
  @IsNotEmpty()
  @IsEnum(CurrencyCode)
  public readonly currency: WrapperType<CurrencyCode>;

  @ApiProperty({
    example: exampleAttributes,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested()
  @IsDefined()
  @Type(() => ProgramRegistrationAttributeDto)
  public readonly programRegistrationAttributes?: ProgramRegistrationAttributeDto[];
}
