import { IsBoolean, IsDate, IsNotEmpty, IsString } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';
import { CookieNames } from '../../shared/enum/cookie.enums';

export class CookieSettingsDto {
  @ApiModelProperty({ example: CookieNames.portal })
  @IsNotEmpty()
  @IsString()
  public readonly tokenKey: string;

  @ApiModelProperty({ example: 'TODO: Add example JWT token' })
  @IsNotEmpty()
  @IsString()
  public readonly tokenValue: string;

  @ApiModelProperty({ example: 'Lax' })
  @IsNotEmpty()
  @IsString()
  public readonly sameSite: string;

  @ApiModelProperty({ example: '' })
  @IsNotEmpty()
  @IsString()
  public readonly domain?: string;

  @ApiModelProperty({ example: '/' })
  @IsNotEmpty()
  @IsString()
  public readonly path?: string;

  @ApiModelProperty({ example: false })
  @IsNotEmpty()
  @IsBoolean()
  public readonly secure: boolean;

  @ApiModelProperty({ example: '2022-04-17T12:02:39.280Z' })
  @IsNotEmpty()
  @IsDate()
  public readonly expires: Date;

  @ApiModelProperty({ example: true })
  @IsNotEmpty()
  @IsBoolean()
  public readonly httpOnly: boolean;
}
