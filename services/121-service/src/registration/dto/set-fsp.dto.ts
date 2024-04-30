import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { FinancialServiceProviderName } from '../../financial-service-provider/enum/financial-service-provider-name.enum';

const fspArray = Object.values(FinancialServiceProviderName).map((item) => String(item));

export class UpdateChosenFspDto {
  @ApiProperty({
    enum: fspArray,
    example: fspArray.join(' | '),
  })
  @IsIn(fspArray)
  public readonly newFspName: FinancialServiceProviderName;
  @ApiProperty({
    example: {
      whatsappPhoneNumber: '31600000000',
    },
  })
  @IsOptional()
  public readonly newFspAttributes: JSON;
}
