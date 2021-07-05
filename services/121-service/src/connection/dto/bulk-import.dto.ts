import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';
import { fspName } from '../../programs/fsp/financial-service-provider.entity';

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

export class ImportRegistrationsDto {
  @ApiModelProperty({ default: 'en' })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(6)
  public preferredLanguage: string;

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
