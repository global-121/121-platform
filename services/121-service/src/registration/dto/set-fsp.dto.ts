import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

const fspArray = Object.values(FinancialServiceProviderName).map((item) =>
  String(item),
);

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
  public readonly newFspAttributes?: Record<string, unknown>;
}
