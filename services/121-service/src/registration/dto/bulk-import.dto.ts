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
import { FspName } from '../../fsp/enum/fsp-name.enum';
import { ImportFspReconciliationArrayDto } from '../../payments/dto/import-fsp-reconciliation.dto';
import { LanguageEnum } from '../enum/language.enum';
import { RegistrationStatusEnum } from '../enum/registration-status.enum';

export enum ImportStatus {
  imported = 'imported',
  invalidPhoneNumber = 'invalidPhoneNumber',
  existingPhoneNumber = 'existingPhoneNumber',
  notFound = 'notFound',
  paymentSuccess = 'paymentSuccess',
  paymentFailed = 'paymentFailed',
}

const fspArray = Object.values(FspName).map((item) => String(item));
const languageArray = Object.values(LanguageEnum).map((item) => String(item));
export class BulkImportDto {
  @ApiProperty()
  @IsString()
  public phoneNumber: string;

  @ApiProperty()
  @IsNumber()
  @IsInt()
  @IsPositive()
  @IsOptional()
  public paymentAmountMultiplier: number;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  @IsOptional()
  public maxPayments: number;

  @ApiProperty({
    enum: languageArray,
    example: languageArray.join(' | '),
  })
  @IsEnum(LanguageEnum)
  @IsOptional()
  public preferredLanguage: LanguageEnum;

  @ApiProperty({ example: 'utrecht.houten' })
  @IsString()
  @IsOptional()
  public scope: string;
}

export class BulkImportResult extends BulkImportDto {
  public importStatus: ImportStatus;
  public registrationStatus: RegistrationStatusEnum | string;
}

export class ImportFspReconciliationResult extends ImportFspReconciliationArrayDto {
  public importStatus: ImportStatus;
}

export class ImportResult {
  public aggregateImportResult: AggregateImportResult;
  public importResult?: BulkImportResult[];
  public uploadFspReconciliationResult?: ImportFspReconciliationResult[];
}

export class AggregateImportResult {
  public countImported?: number;
  public countExistingPhoneNr?: number;
  public countInvalidPhoneNr?: number;
  public countNotFound?: number;
  public countPaymentSuccess?: number;
  public countPaymentFailed?: number;
  public countPaymentStarted?: number;
}
export class ImportRegistrationsDto extends BulkImportDto {
  @ApiProperty({
    enum: fspArray,
    example: fspArray.join(' | '),
  })
  @IsIn(fspArray)
  public fspName: FspName;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @Length(5, 200)
  public referenceId: string;

  @ApiProperty()
  public scope: string;
}
