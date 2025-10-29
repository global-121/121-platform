import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
} from 'class-validator';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { UILanguageEnum } from '@121-service/src/shared/enum/ui-language.enum';
import { WrapperType } from '@121-service/src/wrapper.type';

export enum ImportStatus {
  imported = 'imported',
  notFound = 'notFound',
  paymentSuccess = 'paymentSuccess',
  paymentFailed = 'paymentFailed',
}

const fspArray = Object.values(Fsps).map((item) => String(item));
const languageArray = Object.values(UILanguageEnum).map((item) => String(item));
class BulkImportDto {
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
  @IsEnum(UILanguageEnum)
  @IsOptional()
  public preferredLanguage?: WrapperType<UILanguageEnum>;

  @ApiProperty({ example: 'utrecht.houten' })
  @IsString()
  @IsOptional()
  public scope?: string;
}

class BulkImportResult extends BulkImportDto {
  public importStatus: ImportStatus;
  public registrationStatus: RegistrationStatusEnum | string;
}

export class ImportResult {
  public aggregateImportResult: {
    countImported: number;
  };
  public importResult?: BulkImportResult[];
}

export class ImportRegistrationsDto extends BulkImportDto {
  @ApiProperty({
    example: fspArray.join(' | '),
  })
  @IsString()
  // Should we change this to a more specific name?
  // It could also be programFspConfigurationName (which is a good name for us programmers)
  // However this name is also used by users in the csv file, so it should be a name that is understandable for them
  public programFspConfigurationName: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @Length(5, 200)
  public referenceId?: string;

  @ApiProperty()
  @IsOptional()
  declare public scope?: string;
}
