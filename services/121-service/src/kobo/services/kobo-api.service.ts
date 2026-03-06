import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';
import { joinURL } from 'ufo';

import { EXTERNAL_API } from '@121-service/src/config';
import { KoboAssetDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-asset.dto';
import { KoboAssetResponseDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-asset-response.dto';
import { KoboSubmissionDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-submission.dto';
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
    // Use joinURL instead of new URL as the baseUrl may have a path component and new URL would ignore it
    const apiUrl = joinURL(baseUrl, 'api/v2/assets', assetUid, 'deployment');

    const headers = new Headers();
    headers.append('Authorization', `Token ${token}`);

    const response = await this.httpService.get<
      AxiosResponse<KoboAssetResponseDto | unknown>
    >(apiUrl, headers);

    if (this.isValidKoboResponse<KoboAssetResponseDto>(response)) {
      const responseBody = response.data;
      if (!responseBody.version_id || !responseBody.asset) {
        throw new Error('Kobo information is missing version_id or asset');
      }
      return responseBody.asset;
    }

    this.throwKoboApiError({
      response,
      assetUid,
      apiUrl,
      notFoundMessage:
        'Kobo information not found. This form does not exist or is not (yet) deployed',
      operationDescription: 'fetch Kobo information',
    });
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
    // Use joinURL instead of new URL as the baseUrl may have a path component and new URL would ignore it
    const apiUrl = joinURL(baseUrl, 'api/v2/assets', assetUid, 'hooks');

    const headers = new Headers();
    headers.append('Authorization', `Token ${token}`);

    const response = await this.httpService.get<
      AxiosResponse<
        | {
            results: {
              url: string;
            }[];
          }
        | unknown
      >
    >(apiUrl, headers);

    if (
      this.isValidKoboResponse<{
        results: {
          url: string;
        }[];
      }>(response)
    ) {
      return response.data.results.map((webhook) => webhook.url);
    }

    this.throwKoboApiError({
      response,
      assetUid,
      apiUrl,
      notFoundMessage: 'Kobo asset not found. This asset does not exist',
      operationDescription: 'fetch Kobo webhooks',
    });
  }

  private isValidKoboResponse<T>(
    response: AxiosResponse<T | unknown>,
  ): response is AxiosResponse<T> {
    return [
      HttpStatus.OK,
      HttpStatus.CREATED,
      HttpStatus.ACCEPTED,
      HttpStatus.NO_CONTENT,
    ].includes(response.status);
  }

  public async createKoboWebhook({
    assetUid,
    token,
    baseUrl,
  }: {
    assetUid: string;
    token: string;
    baseUrl: string;
  }): Promise<void> {
    // Trailing slash is required: without it the API returns a 301 redirect,
    // which Axios follows by downgrading POST → GET (returning a list response instead of creating)
    const apiUrl = joinURL(baseUrl, 'api/v2/assets', assetUid, 'hooks/');

    const headers = new Headers();
    headers.append('Authorization', `Token ${token}`);

    const webhookName =
      'Create a registration in the 121 Platform when a submission is received';
    const webhookUrl = joinURL(EXTERNAL_API.rootApi, 'kobo/webhook');
    const webhookSubsetFields = ['_uuid', '_xform_id_string'];

    const body = {
      name: webhookName,
      endpoint: webhookUrl,
      active: true,
      subset_fields: webhookSubsetFields,
    };

    const response = await this.httpService.post<AxiosResponse>(
      apiUrl,
      body,
      headers,
    );

    if (this.isValidKoboResponse(response)) {
      return;
    }

    this.throwKoboApiError({
      response,
      assetUid,
      apiUrl,
      notFoundMessage: 'Kobo asset not found. This asset does not exist',
      operationDescription: 'create Kobo webhook',
    });
  }

  public async getSubmission({
    token,
    assetId,
    baseUrl,
    submissionUuid,
  }: {
    token: string;
    assetId: string;
    baseUrl: string;
    submissionUuid: string;
  }): Promise<KoboSubmissionDto> {
    const apiUrl = joinURL(
      baseUrl,
      'api/v2/assets',
      assetId,
      'data',
      submissionUuid,
    );

    const headers = new Headers();
    headers.append('Authorization', `Token ${token}`);

    const response = await this.httpService.get<
      AxiosResponse<KoboSubmissionDto>
    >(apiUrl, headers);

    if (this.isValidKoboResponse<KoboSubmissionDto>(response)) {
      return response.data;
    }

    this.throwKoboApiError({
      response,
      assetUid: assetId,
      apiUrl,
      notFoundMessage: 'Kobo submission not found',
      operationDescription: 'fetch Kobo submission',
    });
  }

  private throwKoboApiError({
    response,
    assetUid,
    apiUrl,
    notFoundMessage,
    operationDescription,
  }: {
    response: AxiosResponse<unknown>;
    assetUid: string;
    apiUrl: string;
    notFoundMessage: string;
    operationDescription: string;
  }): never {
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

    const errorDetail = (response.data as any)?.detail || 'Unknown error';
    throw new HttpException(
      `Failed to ${operationDescription} for asset: ${assetUid}, url: ${apiUrl}: ${errorDetail}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}
