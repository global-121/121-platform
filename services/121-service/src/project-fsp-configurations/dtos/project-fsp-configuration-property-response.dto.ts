import { ApiProperty } from '@nestjs/swagger';

export class ProjectFspConfigurationPropertyResponseDto {
  @ApiProperty({ example: 'username' })
  public readonly name: string;

  @ApiProperty({ example: 'RC01' })
  public readonly value;

  @ApiProperty({ example: new Date() })
  public updated: Date;
}
