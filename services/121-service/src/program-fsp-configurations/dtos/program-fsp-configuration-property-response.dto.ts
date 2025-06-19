import { ApiProperty } from '@nestjs/swagger';

export class ProgramFspConfigurationPropertyResponseDto {
  @ApiProperty({ example: 'username' })
  public readonly name: string;

  @ApiProperty({ example: new Date() })
  public updated: Date;
}
