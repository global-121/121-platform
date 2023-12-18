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

export class AssignmentResponseDTO {
  @ApiProperty({ example: 1 })
  public programId: number;

  @ApiProperty({ example: 1 })
  public userId: number;

  @ApiProperty({ example: [] })
  public roles: UserRoleResponseDTO[];

  @ApiProperty({
    example: 'scope',
  })
  public scope?: string;
}
