import { IsNotEmpty, IsString } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export class BulkImportDto {
  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  public phoneNumber: string;

  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  public namePartnerOrganization: string;
}

export class ImportResult {
  public countImported: number;
  public countExistingPhoneNr: number;
  public countInvalidPhoneNr: number;
}
