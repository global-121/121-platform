import { ApiProperty } from '@nestjs/swagger';

import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

export class ExcelFspConfigurationResponseDto {
  @ApiProperty({ example: 'excel-cash-in-hand' })
  public readonly name: string;

  @ApiProperty({ example: { en: 'Cash in hand' } })
  public readonly label: UILanguageTranslation;

  @ApiProperty({ example: 'phoneNumber' })
  public readonly uniqueIdentifierField: string;

  @ApiProperty({
    example: ['fullName', 'phoneNumber'],
    description:
      'Fields included in the payment report sent to the FSP. Empty when not configured.',
  })
  public readonly exportFields: string[];
}
