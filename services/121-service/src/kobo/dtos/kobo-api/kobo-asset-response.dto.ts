import { KoboAssetDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-asset.dto';

// This is a non exhaustive list of properties for the Kobo Entity, these only cover what is needed at the moment.

export interface KoboAssetResponseDto {
  asset?: KoboAssetDto; // if success
  version_id?: string; // if success
  detail?: string; // if error
}
