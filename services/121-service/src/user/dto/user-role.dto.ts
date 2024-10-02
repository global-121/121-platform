import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

export class CreateUserRoleDto {
  @ApiProperty({ example: 'new_user_role' })
  @IsNotEmpty()
  @IsString()
  public readonly role: string;

  @ApiProperty({ example: 'New user role label' })
  @IsString()
  public readonly label: string;

  @ApiProperty({ example: 'New user role description' })
  @IsString()
  public readonly description: string;

  @ApiProperty({
    enum: PermissionEnum,
    example: Object.values(PermissionEnum),
  })
  public readonly permissions: PermissionEnum[];
}

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
