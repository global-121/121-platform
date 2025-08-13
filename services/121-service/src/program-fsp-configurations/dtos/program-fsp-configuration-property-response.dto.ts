import { ApiProperty } from '@nestjs/swagger';

export class ProgramFspConfigurationPropertyResponseDto {
  @ApiProperty({ example: 'username' })
  public readonly name: string;

  @ApiProperty({ example: 'RC01' })
  public readonly value: string;

  @ApiProperty({ example: new Date() })
  public updated: Date;
}
