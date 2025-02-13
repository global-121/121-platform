import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import { ExportType } from '@121-service/src/metrics/enum/export-type.enum';
import { CreateOptionsDto } from '@121-service/src/projects/dtos/create-options.dto';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { QuestionOption } from '@121-service/src/shared/enum/question.enums';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';
import { WrapperType } from '@121-service/src/wrapper.type';

class BaseProgramRegistrationAttributeDto {
  @ApiProperty({ required: false })
  @ValidateIf((o) => o.type === RegistrationAttributeTypes.dropdown)
  @ValidateNested()
  @IsOptional()
  @Type(() => CreateOptionsDto)
  public readonly options?: QuestionOption[];

  @ApiProperty()
  @IsOptional()
  public readonly scoring?: Record<string, unknown>;

  @ApiProperty({ required: false })
  @IsOptional()
  public pattern?: string;

  @ApiProperty({
    example: false,
  })
  @IsOptional()
  public showInPeopleAffectedTable?: boolean;

  @ApiProperty({ example: true })
  @IsOptional()
  public readonly editableInPortal?: boolean;

  @ApiProperty({
    example: [ExportType.allPeopleAffected, ExportType.included],
    required: false,
  })
  @IsOptional()
  @IsEnum(ExportType, { each: true }) // Use @IsEnum decorator to validate each element
  public readonly export?: WrapperType<ExportType[]>;

  @ApiProperty({
    example: {
      en: '+31 6 00 00 00 00',
    },
    required: false,
  })
  @IsOptional()
  public placeholder?: LocalizedString;

  @ApiProperty({
    example: false,
    required: false,
  })
  @IsOptional()
  public duplicateCheck?: boolean;
}

export class ProgramRegistrationAttributeDto extends BaseProgramRegistrationAttributeDto {
  @ApiProperty({})
  @IsNotEmpty()
  @IsString()
  public readonly name: string;

  @ApiProperty({
    example: {
      en: 'Please enter your last name:',
      fr: "Remplissez votre nom, s'il vous plaît:",
    },
  })
  public readonly label: LocalizedString;

  @ApiProperty({
    example: RegistrationAttributeTypes.text,
  })
  @IsString()
  @IsIn([
    RegistrationAttributeTypes.numeric,
    RegistrationAttributeTypes.dropdown,
    RegistrationAttributeTypes.tel,
    RegistrationAttributeTypes.text,
    RegistrationAttributeTypes.date,
  ])
  public readonly type: WrapperType<RegistrationAttributeTypes>;

  @ApiProperty({
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  public readonly isRequired?: boolean;
}

export class UpdateProgramRegistrationAttributeDto extends BaseProgramRegistrationAttributeDto {
  @ApiProperty({
    example: {
      en: 'Please enter your last name:',
      fr: "Remplissez votre nom, s'il vous plaît:",
    },
    required: false,
  })
  @IsOptional()
  public readonly label?: WrapperType<LocalizedString>;

  @ApiProperty({
    example: RegistrationAttributeTypes.numeric,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn([
    RegistrationAttributeTypes.numeric,
    RegistrationAttributeTypes.dropdown,
    RegistrationAttributeTypes.tel,
    RegistrationAttributeTypes.text,
    RegistrationAttributeTypes.date,
  ])
  public readonly type?: WrapperType<RegistrationAttributeTypes>;

  @ApiProperty({
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  public readonly isRequired?: boolean;
}
