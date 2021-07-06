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
import { fspName } from '../../programs/fsp/financial-service-provider.entity';
import { Language } from '../validation-data/dto/custom-data-attributes';

export class BulkImportDto {
  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  public phoneNumber: string;

  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  public namePartnerOrganization: string;

  @ApiModelProperty()
  @IsNumber()
  @IsInt()
  @Min(1)
  public paymentAmountMultiplier: number;
}

export class ImportResult {
  public countImported: number;
  public countExistingPhoneNr?: number;
  public countInvalidPhoneNr?: number;
}

const fspArray = Object.values(fspName).map(item => String(item));
const languageArray = Object.values(Language).map(item => String(item));

export class ImportRegistrationsDto {
  @ApiModelProperty({
    enum: languageArray,
    example: languageArray.join(' | '),
  })
  @IsIn(languageArray)
  public preferredLanguage: Language;

  @ApiModelProperty()
  @IsString()
  public namePartnerOrganization: string;

  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  public phoneNumber: string;

  @ApiModelProperty({
    enum: fspArray,
    example: fspArray.join(' | '),
  })
  @IsIn(fspArray)
  public fspName: fspName;

  @ApiModelProperty()
  @IsArray()
  public programAttributes: DynamicImportAttribute[];
}

export class DynamicImportAttribute {
  public attribute: string;
  public value: string;
}
