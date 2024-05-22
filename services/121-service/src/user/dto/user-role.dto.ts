import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserRoleDto {
  @ApiProperty({ example: 'new_user_role' })
  @IsNotEmpty()
  @IsString()
  public readonly role: string;
  @ApiProperty({ example: 'New user role label' })
  @IsString()
  public readonly label: string;

  @ApiProperty({
    enum: PermissionEnum,
    example: Object.values(PermissionEnum),
  })
  public readonly permissions: PermissionEnum[];
}

export class UpdateUserRoleDto {
  @ApiProperty({ example: 'Updated user role label' })
  @IsString()
  public readonly label: string;

  @ApiProperty({
    enum: PermissionEnum,
    example: Object.values(PermissionEnum),
  })
  @IsArray()
  public readonly permissions: PermissionEnum[];
}
