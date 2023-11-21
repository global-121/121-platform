import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UserRoleResponseDTO {
  @ApiProperty({ example: 5 })
  public id: number;

  @ApiProperty({ example: 'field-validation' })
  public role: string;

  @ApiProperty({ example: 'Do Field Validation' })
  public label: string;

  @ApiProperty({
    example: ['registration:attribute.update', 'registration:fsp.read'],
  })
  @IsOptional()
  public permissions?: string[];
}
