import { IsNotEmpty } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';
import { UserRO } from '../user.interface';
import { CookieSettingsDto } from './cookie-settings.dto';

export class LoginResponseDto {
  @ApiModelProperty({ example: '' })
  @IsNotEmpty()
  public readonly userRo: UserRO;

  @ApiModelProperty({ example: '' })
  @IsNotEmpty()
  public readonly cookieSettings: CookieSettingsDto;
}
