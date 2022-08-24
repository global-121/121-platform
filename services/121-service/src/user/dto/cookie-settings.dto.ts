import { IsBoolean, IsDate, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CookieNames } from '../../shared/enum/cookie.enums';

export class CookieSettingsDto {
  @ApiProperty({ example: CookieNames.portal })
  @IsNotEmpty()
  @IsString()
  public readonly tokenKey: string;

  @ApiProperty({ example: 'TODO: Add example JWT token' })
  @IsNotEmpty()
  @IsString()
  public readonly tokenValue: string;

  @ApiProperty({ example: 'Lax' })
  @IsNotEmpty()
  @IsString()
  public readonly sameSite: string;

  @ApiProperty({ example: '' })
  @IsNotEmpty()
  @IsString()
  public readonly domain?: string;

  @ApiProperty({ example: '/' })
  @IsNotEmpty()
  @IsString()
  public readonly path?: string;

  @ApiProperty({ example: false })
  @IsNotEmpty()
  @IsBoolean()
  public readonly secure: boolean;

  @ApiProperty({ example: '2022-04-17T12:02:39.280Z' })
  @IsNotEmpty()
  @IsDate()
  public readonly expires: Date;

  @ApiProperty({ example: true })
  @IsNotEmpty()
  @IsBoolean()
  public readonly httpOnly: boolean;
}
