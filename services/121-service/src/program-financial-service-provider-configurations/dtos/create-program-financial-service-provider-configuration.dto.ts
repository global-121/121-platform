import {
  FinancialServiceProviderConfigurationEnum,
  FinancialServiceProviderName,
} from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateProgramFinancialServiceProviderConfigurationDto {
  // TODO: Do we accept spaces in the name? Any other naming criteria? Special characters? All lowercase?
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
    enum: FinancialServiceProviderName,
    type: 'enum',
    example: FinancialServiceProviderName.intersolveVoucherWhatsapp,
  })
  @IsNotEmpty()
  public readonly financialServiceProviderName: FinancialServiceProviderName;
}
