import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class MtnApiAuthenticationResponseBodyDto {
  @ApiProperty({ description: 'OAuth2 access token' })
  @IsString()
  public readonly access_token: string;

  @ApiProperty({ description: 'Token type', example: 'access_token' })
  @IsString()
  public readonly token_type: 'access_token';

  @ApiProperty({ description: 'Token expiry time in seconds' })
  @IsNumber()
  public readonly expires_in: number;
}
