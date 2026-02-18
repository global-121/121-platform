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
    // Use joinURL instead of new URL as the baseURL may have a path component
    const apiUrl = joinURL(baseUrl, 'api/v2/assets', assetUid, 'deployment');

    const headers = new Headers();
    headers.append('Authorization', `Token ${token}`);

    const response = await this.httpService.get<
      AxiosResponse<KoboAssetResponseDto>
    >(apiUrl, headers);
    const responseBody = response.data;

    this.handleKoboApiError({
      response,
      assetUid,
      apiUrl,
      notFoundMessage:
        'Kobo information not found. This form does not exist or is not (yet) deployed',
      operationDescription: 'fetch Kobo information',
    });

    // This should never happen but it makes TypeScript happy and throws a meaningful error
    if (!responseBody.version_id || !responseBody.asset) {
      throw new Error('Kobo information is missing version_id or asset');
    }

    return responseBody.asset;
  }

  public async getExistingKoboWebhooks({
    assetUid,
    token,
    baseUrl,
  }: {
    assetUid: string;
    token: string;
    baseUrl: string;
  }): Promise<string[]> {
    // Use joinURL instead of template strings as the baseUrl may have a path component
    const apiUrl = joinURL(baseUrl, 'api/v2/assets', assetUid, 'hooks');

    const headers = new Headers();
    headers.append('Authorization', `Token ${token}`);

    const response = await this.httpService.get<
      AxiosResponse<{
        results: {
          url: string;
        }[];
      }>
    >(apiUrl, headers);

    this.handleKoboApiError({
      response,
      assetUid,
      apiUrl,
      notFoundMessage: 'Kobo asset not found. This asset does not exist',
      operationDescription: 'fetch Kobo webhooks',
    });

    if (!response.data.results) {
      throw new Error('Kobo webhook response is missing results');
    }

    return response.data.results.map((webhook) => webhook.url);
  }

  private handleKoboApiError({
    response,
    assetUid,
    apiUrl,
    notFoundMessage,
    operationDescription,
  }: {
    response: AxiosResponse;
    assetUid: string;
    apiUrl: string;
    notFoundMessage: string;
    operationDescription: string;
  }): void {
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
        `${notFoundMessage} for asset: ${assetUid}, url: ${apiUrl}.`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (response.status !== HttpStatus.OK) {
      const errorDetail = (response.data as any)?.detail || 'Unknown error';
      throw new HttpException(
        `Failed to ${operationDescription} for asset: ${assetUid}, url: ${apiUrl}: ${errorDetail}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
