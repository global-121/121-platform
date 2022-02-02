import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';
import { FspName } from '../../fsp/financial-service-provider.entity';
import { LanguageEnum } from '../enum/language.enum';

export enum ImportStatus {
  imported = 'imported',
  invalidPhoneNumber = 'invalidPhoneNumber',
  existingPhoneNumber = 'existingPhoneNumber',
}

export class BulkImportDto {
  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  public phoneNumber: string;

  @ApiModelProperty()
  @IsNumber()
  @IsInt()
  @Min(1)
  public paymentAmountMultiplier: number;

  @ApiModelProperty()
  @IsArray()
  public programAttributes: DynamicImportAttribute[];
}

export class BulkImportResult extends BulkImportDto {
  public importStatus: ImportStatus;
}

export class ImportResult {
  public aggregateImportResult: AggregateImportResult;
  public importResult?: BulkImportResult[];
}

export class AggregateImportResult {
  public countImported: number;
  public countExistingPhoneNr?: number;
  public countInvalidPhoneNr?: number;
}

const fspArray = Object.values(FspName).map(item => String(item));
const languageArray = Object.values(LanguageEnum).map(item => String(item));

export class ImportRegistrationsDto {
  @ApiModelProperty({
    enum: languageArray,
    example: languageArray.join(' | '),
  })
  @IsIn(languageArray)
  public preferredLanguage: LanguageEnum;

  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  public phoneNumber: string;

  @ApiModelProperty({
    enum: fspArray,
    example: fspArray.join(' | '),
  })
  @IsIn(fspArray)
  public fspName: FspName;

  @ApiModelProperty()
  @IsArray()
  public programAttributes: DynamicImportAttribute[];
}

export class DynamicImportAttribute {
  public attribute: string;
  public value: string;
}
