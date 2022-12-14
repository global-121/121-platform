import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { FspName } from '../../fsp/financial-service-provider.entity';
import { ImportFspReconciliationDto } from '../../payments/dto/import-fsp-reconciliation.dto';
import { LanguageEnum } from '../enum/language.enum';
import { RegistrationStatusEnum } from '../enum/registration-status.enum';

export enum ImportStatus {
  imported = 'imported',
  invalidPhoneNumber = 'invalidPhoneNumber',
  existingPhoneNumber = 'existingPhoneNumber',
  notFound = 'notFound',
}

export class BulkImportDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public phoneNumber: string;

  @ApiProperty()
  @IsNumber()
  @IsInt()
  @Min(1)
  @IsOptional()
  public paymentAmountMultiplier: number;

  @ApiProperty()
  @IsEnum(LanguageEnum)
  @IsOptional()
  public preferredLanguage: LanguageEnum;
}

export class BulkImportResult extends BulkImportDto {
  public importStatus: ImportStatus;
  public registrationStatus: RegistrationStatusEnum | string;
}

export class ImportFspReconciliationResult extends ImportFspReconciliationDto {
  public importStatus: ImportStatus;
}

export class ImportResult {
  public aggregateImportResult: AggregateImportResult;
  public importResult?: BulkImportResult[];
  public uploadFspReconciliationResult?: ImportFspReconciliationResult[];
}

export class AggregateImportResult {
  public countImported: number;
  public countExistingPhoneNr?: number;
  public countInvalidPhoneNr?: number;
  public countNotFound?: number;
}

const fspArray = Object.values(FspName).map(item => String(item));
const languageArray = Object.values(LanguageEnum).map(item => String(item));

export class ImportRegistrationsDto extends BulkImportDto {
  @ApiProperty({
    enum: languageArray,
    example: languageArray.join(' | '),
  })
  @IsIn(languageArray)
  public preferredLanguage: LanguageEnum;

  @ApiProperty({
    enum: fspArray,
    example: fspArray.join(' | '),
  })
  @IsIn(fspArray)
  public fspName: FspName;
}
