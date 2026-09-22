import { ApiProperty } from '@nestjs/swagger';

export class ExcelFspConfigurationResponseDto {
  @ApiProperty({ example: 'phoneNumber' })
  public readonly uniqueIdentifierField: string;

  @ApiProperty({
    example: ['fullName', 'phoneNumber'],
    description:
      'Fields included in the payment report sent to the FSP. Empty when not configured.',
  })
  public readonly exportFields: string[];
}
