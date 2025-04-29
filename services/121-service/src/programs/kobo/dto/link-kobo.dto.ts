import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { DEBUG } from '@121-service/src/config';
// ##TODO: Rename?
export class LinkKoboDto {
  @ApiProperty({
    required: false,
    description: 'A valid Kobo token',
    example: DEBUG ? process.env.KOBO_TOKEN : 'example-token',
  })
  @IsString()
  @IsOptional()
  readonly koboToken: string;

  @ApiProperty({
    required: false,
    description: 'A valid Kobo asset-ID',
    example: process.env.KOBO_ASSET_ID,
  })
  @IsString()
  @IsOptional()
  readonly koboAssetId: string;

  @ApiProperty({
    required: false,
    description: 'A valid Kobo url',
    example: process.env.KOBO_URL,
  })
  @IsString()
  @IsOptional()
  readonly koboUrl: string;
}
