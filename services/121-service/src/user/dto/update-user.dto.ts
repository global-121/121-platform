import { LoginUserDto } from '@121-service/src/user/dto/login-user.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateUserPasswordDto extends LoginUserDto {
  @ApiProperty({ example: 'newPassword' })
  @IsNotEmpty()
  public readonly newPassword: string;
}

export class UpdateUserDto {
  public readonly id: number;

  @IsOptional()
  public readonly isEntraUser?: boolean;

  @IsOptional()
  public readonly lastLogin?: Date;

  @ApiProperty({ example: true }) // Only this field is @ApiProperty, as only this field is currently used from endpoint/swagger, the rest only from service.
  @IsOptional()
  public readonly isOrganizationAdmin?: boolean;
}
