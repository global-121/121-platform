import { ApiProperty } from '@nestjs/swagger';

export class ProgramFinancialServiceProviderConfigurationPropertyResponseDto {
  @ApiProperty({ example: 'username' })
  public readonly name: string;

  @ApiProperty({ example: new Date() })
  public updated: Date;
}
