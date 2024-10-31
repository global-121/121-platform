import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDefined,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { v4 as uuid } from 'uuid';

import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { CreateProgramFinancialServiceProviderConfigurationPropertyDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/create-program-financial-service-provider-configuration-property.dto';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

export class CreateProgramFinancialServiceProviderConfigurationDto {
  @ApiProperty({ example: 'VisaDebitCards' })
  @IsNotEmpty()
  @IsString()
  public readonly name: string;

  @ApiProperty({
    example: {
      en: 'Visa Debit Cards',
      nl: 'Visa-betaalkaarten',
    },
  })
  @IsNotEmpty()
  public readonly label: LocalizedString;

  @ApiProperty({
    enum: FinancialServiceProviders,
    type: 'enum',
    example: FinancialServiceProviders.intersolveVoucherWhatsapp,
  })
  @IsNotEmpty()
  public readonly financialServiceProviderName: FinancialServiceProviders;

  @IsArray()
  @ValidateNested()
  @IsDefined()
  @IsOptional()
  @Type(() => CreateProgramFinancialServiceProviderConfigurationPropertyDto)
  @ApiProperty({
    example: [
      { name: 'username', value: 'user123' },
      { name: 'password', value: `password-${uuid()}` },
    ],
  })
  public readonly properties?: CreateProgramFinancialServiceProviderConfigurationPropertyDto[];
}
