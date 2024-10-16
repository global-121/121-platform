import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
} from 'class-validator';

import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { WrapperType } from '@121-service/src/wrapper.type';

export enum ImportStatus {
  imported = 'imported',
  notFound = 'notFound',
  paymentSuccess = 'paymentSuccess',
  paymentFailed = 'paymentFailed',
}

const fspArray = Object.values(FinancialServiceProviderName).map((item) =>
  String(item),
);
const languageArray = Object.values(LanguageEnum).map((item) => String(item));
export class BulkImportDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  public phoneNumber?: string;

  @ApiProperty()
  @IsNumber()
  @IsInt()
  @IsPositive()
  @IsOptional()
  public paymentAmountMultiplier?: number;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  @IsOptional()
  public maxPayments?: number;

  @ApiProperty({
    enum: languageArray,
    example: languageArray.join(' | '),
  })
  @IsEnum(LanguageEnum)
  @IsOptional()
  public preferredLanguage?: WrapperType<LanguageEnum>;

  @ApiProperty({ example: 'utrecht.houten' })
  @IsString()
  @IsOptional()
  public scope?: string;
}

export class BulkImportResult extends BulkImportDto {
  public importStatus: ImportStatus;
  public registrationStatus: RegistrationStatusEnum | string;
}

export class ImportResult {
  public aggregateImportResult: AggregateImportResult;
  public importResult?: BulkImportResult[];
}

class AggregateImportResult {
  public countImported?: number;
  public countExistingPhoneNr?: number;
  public countInvalidPhoneNr?: number;
  public countNotFound?: number;
  public countPaymentSuccess?: number;
  public countPaymentFailed?: number;
}
export class ImportRegistrationsDto extends BulkImportDto {
  @ApiProperty({
    enum: fspArray,
    example: fspArray.join(' | '),
  })
  @IsIn(fspArray)
  public fspName: FinancialServiceProviderName;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @Length(5, 200)
  public referenceId?: string;

  @ApiProperty()
  @IsOptional()
  public declare scope?: string;
}
