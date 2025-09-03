import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

export class UserRoleResponseDTO {
  @ApiProperty({ example: 5 })
  public id: number;

  @ApiProperty({ example: 'field-validation' })
  public role: string;

  @ApiProperty({ example: 'Do Field Validation' })
  public label: string | null;

  @ApiProperty({ example: 'This role allows you to do field validation' })
  public description: string | null;

  @ApiProperty({
    example: ['registration:attribute.update', 'registration:fsp.read'],
  })
  @IsOptional()
  public permissions?: PermissionEnum[];
}

export class AssignmentResponseDTO {
  @ApiProperty({ example: 1 })
  public projectId: number;

  @ApiProperty({ example: 1 })
  public userId: number;

  @ApiProperty({ example: [] })
  public roles: UserRoleResponseDTO[];

  @ApiProperty({
    example: 'scope',
  })
  public scope?: string;
}
