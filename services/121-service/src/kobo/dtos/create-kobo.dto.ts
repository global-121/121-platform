import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateKoboDto {
  @ApiProperty({ example: 'your-asset-id-here' })
  @IsNotEmpty()
  @IsString()
  public readonly assetId: string;

  @ApiProperty({ example: 'your-kobo-token-here' })
  @IsNotEmpty()
  @IsString()
  public readonly token: string;

  @ApiProperty({ example: 'https://kobo.ifrc.org' })
  @IsNotEmpty()
  @IsString()
  public readonly url: string;
}
