import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

export class UpdateUserRoleDto {
  @ApiProperty({ example: 'Updated user role label' })
  @IsString()
  @IsOptional()
  public readonly label?: string;

  @ApiProperty({ example: 'Updated user role description' })
  @IsString()
  @IsOptional()
  public readonly description?: string;

  @ApiProperty({
    enum: PermissionEnum,
    example: Object.values(PermissionEnum),
  })
  @IsArray()
  @IsOptional()
  public readonly permissions?: PermissionEnum[];
}
