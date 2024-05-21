import { LoginUserDto } from '@121-service/src/user/dto/login-user.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateUserPasswordDto extends LoginUserDto {
  @ApiProperty({ example: 'newPassword' })
  @IsNotEmpty()
  public readonly newPassword: string;
}

export class UpdateUserDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  public readonly id: number;

  @ApiProperty({ example: true })
  @IsOptional()
  public readonly isEntraUser?: boolean;

  @ApiProperty({ example: new Date() })
  @IsOptional()
  public readonly lastLogin?: Date;
}
