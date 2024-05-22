import { CookieSettingsDto } from '@121-service/src/user/dto/cookie-settings.dto';
import { UserRO } from '@121-service/src/user/user.interface';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class LoginResponseDto {
  @ApiProperty({ example: '' })
  @IsNotEmpty()
  public readonly userRo: UserRO;

  @ApiProperty({ example: '' })
  @IsNotEmpty()
  public readonly cookieSettings: CookieSettingsDto;

  public readonly token: string;
}
