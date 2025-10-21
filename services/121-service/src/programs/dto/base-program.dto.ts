import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';
import { WrapperType } from '@121-service/src/wrapper.type';

// A base DTO to share properties between CreateProgramDto and UpdateProgramDto.
// Not to be used directly.

// The class-validator decorators can be inherited, but they are then applied in sequence.
// We want to have *different* validation rules for Create vs Update.
// So the DTO fields that differ are defined separately in the respective DTOs.
// See https://class-validator.sonicar.tech/inheritance/

// All fields are optional, because we want creation with minimal fields and
// updates with patch semantics.
export class BaseProgramDto {
  @ApiProperty({ example: 'Nederland' })
  @IsOptional()
  @IsString()
  public readonly location?: string;

  @ApiProperty({ example: false })
  @IsOptional()
  @IsBoolean()
  public readonly validation?: boolean;

  @ApiProperty({ example: 'NLRC' })
  @IsOptional()
  @IsString()
  public readonly ngo?: string;

  @ApiProperty({ example: { en: 'description' } })
  @IsOptional()
  public readonly description?: LocalizedString;

  @ApiProperty({ example: '2020-05-23T18:25:43.511Z' })
  @IsOptional()
  @IsDateString()
  public readonly startDate?: Date;

  @ApiProperty({ example: '2020-05-23T18:25:43.511Z' })
  @IsOptional()
  @IsDateString()
  public readonly endDate?: Date;

  @ApiProperty({ example: 'week', enum: ['week', 'month'] })
  @IsOptional()
  @IsString()
  public readonly distributionFrequency?: string;

  @ApiProperty({ example: 10 })
  @IsOptional()
  @IsNumber()
  public readonly distributionDuration?: number;

  @ApiProperty({ example: 500 })
  @IsOptional()
  @IsNumber()
  public readonly fixedTransferValue?: number;

  @ApiProperty({ example: '0 + 1 * nrOfHouseHoldMembers' })
  @IsOptional()
  @IsString()
  public readonly paymentAmountMultiplierFormula?: string;

  @ApiProperty({ example: 250 })
  @IsOptional()
  @IsNumber()
  public readonly targetNrRegistrations?: number;

  @ApiProperty({ example: true })
  @IsOptional()
  @IsBoolean()
  public readonly tryWhatsAppFirst?: boolean;

  @ApiProperty({
    example: ['nameFirst', 'nameLast'],
    description:
      'Should be array of name-related program-registration-attributes.',
  })
  @IsOptional()
  @IsArray()
  public readonly fullnameNamingConvention?: string[];

  @ApiProperty({ example: ['en', 'nl'] })
  @IsOptional()
  @IsArray()
  public readonly languages?: WrapperType<LanguageEnum[]>;

  @ApiProperty({ example: false })
  @IsOptional()
  @IsBoolean()
  public readonly enableMaxPayments?: boolean;

  @ApiProperty({ example: false })
  @IsOptional()
  @IsBoolean()
  public readonly enableScope?: boolean;

  @ApiProperty({ example: false })
  @IsOptional()
  @IsBoolean()
  public readonly allowEmptyPhoneNumber?: boolean;

  @ApiProperty({ example: 'https://example.org/dashboard' })
  @IsOptional()
  @IsString()
  public monitoringDashboardUrl?: string;

  @ApiProperty({ example: 100000 })
  @IsOptional()
  @IsNumber()
  public readonly budget?: number;
}
