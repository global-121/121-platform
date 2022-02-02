import { IsNotEmpty, IsString } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';
import { PermissionEnum } from '../permission.enum';

export class CreateUserRoleDto {
  @ApiModelProperty({ example: 'new_user_role' })
  @IsNotEmpty()
  @IsString()
  public readonly role: string;
  @ApiModelProperty({ example: 'New user role label' })
  @IsString()
  public readonly label: string;

  @ApiModelProperty({
    enum: PermissionEnum,
    example: Object.values(PermissionEnum),
  })
  public readonly permissions: PermissionEnum[];
}
