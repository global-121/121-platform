import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import { RegistrationPreferredLanguageEnum } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { LocalizedStringForUI } from '@121-service/src/shared/types/localized-string-for-ui.type';
import { WrapperType } from '@121-service/src/wrapper.type';

/**
 * A base DTO to share properties between CreateProgramDto and UpdateProgramDto.
 *
 * The class-validator decorators can be inherited, but they are then applied in sequence.
 * We want to have *different* validation rules for Create vs Update.
 * So the DTO fields that differ are defined separately in the respective DTOs.
 * See https://class-validator.sonicar.tech/inheritance/
 *
 * All fields are optional, because we want creation with minimal fields and
 * updates with patch semantics.
 */
export abstract class BaseProgramDto {
  @ApiProperty({ example: 'Nederland' })
  @IsOptional()
  @IsString()
  public readonly location?: string;

  @IsOptional()
  @IsBoolean()
  public readonly validation?: boolean;

  @ApiProperty({ example: 'NLRC' })
  @IsOptional()
  @IsString()
  public readonly ngo?: string;

  @ApiProperty({ example: { en: 'description' } })
  @IsOptional()
  public readonly description?: LocalizedStringForUI;

  @ApiProperty({ example: '2020-01-01T00:01:00.000Z' })
  @IsOptional()
  @IsDateString()
  public readonly startDate?: Date;

  @ApiProperty({ example: '2020-12-31T23:59:59.000Z' })
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
  })
  @IsOptional()
  @IsArray()
  public readonly fullnameNamingConvention?: string[];

  @ApiProperty({
    example: Object.values(RegistrationPreferredLanguageEnum),
  })
  @IsOptional()
  @IsArray()
  public readonly languages?: WrapperType<RegistrationPreferredLanguageEnum[]>;

  @IsOptional()
  @IsBoolean()
  public readonly enableMaxPayments?: boolean;

  @IsOptional()
  @IsBoolean()
  public readonly enableScope?: boolean;

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
