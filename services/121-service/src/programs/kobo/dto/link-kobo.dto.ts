import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { IS_DEVELOPMENT } from '@121-service/src/config';

// ##TODO: Rename?
export class LinkKoboDto {
  @ApiProperty({
    required: false,
    description: 'A valid Kobo token',
    // XXX: remove this
    // eslint-disable-next-line n/no-process-env -- can't be bothered to do this the right way right now
    example: IS_DEVELOPMENT ? process.env.KOBO_TOKEN : 'example-token',
  })
  @IsString()
  @IsOptional()
  readonly koboToken: string;

  @ApiProperty({
    required: false,
    description: 'A valid Kobo asset-ID',
    // XXX: remove this
    // eslint-disable-next-line n/no-process-env -- can't be bothered to do this the right way right now
    example: process.env.KOBO_ASSET_ID,
  })
  @IsString()
  @IsOptional()
  readonly koboAssetId: string;

  @ApiProperty({
    required: false,
    description: 'A valid Kobo url',
    // XXX: remove this
    // eslint-disable-next-line n/no-process-env -- can't be bothered to do this the right way right now
    example: process.env.KOBO_URL,
  })
  @IsString()
  @IsOptional()
  readonly koboUrl: string;
}
