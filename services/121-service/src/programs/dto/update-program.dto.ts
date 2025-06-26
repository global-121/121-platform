import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

export class UpdateProgramDto {
  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  public readonly published?: boolean;

  @ApiProperty()
  @IsOptional()
  @IsString()
  public readonly location?: string;

  @ApiProperty({ example: { en: 'title' } })
  @IsOptional()
  public readonly titlePortal?: LocalizedString;

  @ApiProperty()
  @IsOptional()
  @IsString()
  public readonly ngo?: string;

  @ApiProperty({ example: '2020-05-23T18:25:43.511Z' })
  @IsOptional()
  @IsDateString()
  public readonly startDate?: Date;

  @ApiProperty({ example: '2020-05-23T18:25:43.511Z' })
  @IsOptional()
  @IsDateString()
  public readonly endDate?: Date;

  @ApiProperty({ example: 'MWK' })
  @IsOptional()
  @IsString()
  @Length(3, 3, {
    message: 'Currency should be a 3 letter abbreviation',
  })
  public readonly currency?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  public readonly distributionFrequency?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  public readonly distributionDuration?: number;

  @ApiProperty({ example: 500 })
  @IsOptional()
  public readonly fixedTransferValue?: number;

  @ApiProperty({ example: '0 + 1 * nrOfHouseHoldMembers' })
  @IsOptional()
  @IsString()
  public readonly paymentAmountMultiplierFormula?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  public readonly targetNrRegistrations?: number;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  public readonly validation?: boolean;

  @ApiProperty({ example: { en: 'description' } })
  @IsOptional()
  public readonly description?: LocalizedString;

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

  @ApiProperty({ example: 100000 })
  @IsOptional()
  @IsNumber()
  public readonly budget?: number;
}
