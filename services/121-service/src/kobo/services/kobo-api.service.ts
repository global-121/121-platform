import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';
import { joinURL } from 'ufo';

import { KoboAssetDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-asset.dto';
import { KoboAssetResponseDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-asset-response.dto';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Injectable()
export class KoboApiService {
  public constructor(private readonly httpService: CustomHttpService) {}

  public async getDeployedAssetOrThrow({
    assetUid,
    token,
    baseUrl,
  }: {
    assetUid: string;
    token: string;
    baseUrl: string;
  }): Promise<KoboAssetDto> {
    // Use joinURL instead of new URL as the baseUlr may have a path component
    const apiUrl = joinURL(baseUrl, 'api/v2/assets', assetUid, 'deployment');

    const headers = new Headers();
    headers.append('Authorization', `Token ${token}`);

    const response = await this.httpService.get<
      AxiosResponse<KoboAssetResponseDto>
    >(apiUrl, headers);
    const responseBody = response.data;

    if (
      response.status === HttpStatus.UNAUTHORIZED ||
      response.status === HttpStatus.FORBIDDEN
    ) {
      throw new HttpException(
        `Unauthorized access to Kobo API for asset: ${assetUid}, url: ${apiUrl}. Please check if the provided token is valid.`,
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (response.status === HttpStatus.NOT_FOUND) {
      throw new HttpException(
        `Kobo information not found for asset: ${assetUid}, url: ${apiUrl}. This form does not exist or is not (yet) deployed.`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Unexpected error
    if (response.status !== HttpStatus.OK) {
      throw new HttpException(
        `Failed to fetch Kobo information from url: ${apiUrl}: ${responseBody.detail || 'Unknown error'}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // This should never happen but it makes TypeScript happy and throws a meaningful error
    if (!responseBody.version_id || !responseBody.asset) {
      throw new Error('Kobo information is missing version_id or asset');
    }

    return responseBody.asset;
  }
}
