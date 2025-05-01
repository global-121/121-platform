import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { KoboFormResponse } from '@121-service/src/programs/kobo/interfaces/kobo-form-response';
import {
  KOBO_WEBHOOK_121_ENDPOINT,
  KOBO_WEBHOOK_SUBSET_FIELDS,
} from '@121-service/src/programs/kobo/kobo.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

const WEBHOOK_NAME = 'Notify 121 on new submission';

/**
 * Service that handles all communication with Kobo API
 */
@Injectable()
export class KoboApiService {
  constructor(private readonly httpService: CustomHttpService) {}

  public async getSubmissions({
    token,
    assetId,
    baseUrl,
    submissionUuid,
  }: {
    token: string;
    assetId: string;
    baseUrl: string;
    submissionUuid?: string;
  }): Promise<Record<string, any>[]> {
    let apiUrl = `${baseUrl}/api/v2/assets/${assetId}/data/`;

    // TODO: Make the query parameter parsing nicer
    if (submissionUuid) {
      apiUrl += `?query={"_uuid": "${submissionUuid}"}`;
    }
    console.log('🚀 ~ KoboApiService ~ apiUrl:', apiUrl);
    const headers = [
      {
        name: `Authorization`,
        value: `Token ${token}`,
      },
    ];
    const response = (await this.httpService.get(apiUrl, headers)) as any;
    const responseBody = response.data;
    return responseBody.results || [];
  }

  public async getKoboInformation(
    token: string,
    assetId: string,
    baseUrl: string,
  ): Promise<KoboFormResponse> {
    const apiUrl = `${baseUrl}/api/v2/assets/${assetId}/deployment/?format=json`;
    const headers = [
      {
        name: `Authorization`,
        value: `Token ${token}`,
      },
    ];

    try {
      const response = (await this.httpService.get(apiUrl, headers)) as any;
      const responseBody = response.data;

      if (response.status === 404) {
        throw new HttpException(
          `Kobo information not found for asset: ${assetId}. This form does not exist or is not (yet) deployed.`,
          HttpStatus.NOT_FOUND,
        );
      }
      if (response.status !== 200) {
        throw new HttpException(
          `Failed to fetch Kobo information: ${responseBody.detail || 'Unknown error'}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!responseBody.version_id) {
        throw new HttpException(
          'Kobo information is missing version_id',
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        name: responseBody.asset.name ?? '',
        survey: responseBody.asset.content.survey || [],
        choices: responseBody.asset.content.choices || [],
        languages: responseBody.asset.summary.languages || [],
        dateDeployed: responseBody.asset.date_deployed,
        versionId: responseBody.asset.version_id,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error connecting to Kobo API: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  public async getExistingKoboWebhooks(
    token: string,
    assetId: string,
    baseUrl: string,
  ): Promise<
    {
      name: string;
      endpoint: string;
      subset_fields: string[];
    }[]
  > {
    const apiUrl = `${baseUrl}/api/v2/assets/${assetId}/hooks/`;
    const headers = [
      {
        name: `Authorization`,
        value: `Token ${token}`,
      },
    ];

    const response = (await this.httpService.get(apiUrl, headers)) as any;
    console.log('🚀 ~ KoboApiService ~ response:', response.data);
    const webhooks = response.data.results.map((webhook: any) => {
      return {
        name: webhook.name,
        endpoint: webhook.endpoint,
        subset_fields: webhook.subset_fields,
      };
    });

    return webhooks;
  }

  public async createKoboWebhook(
    token: string,
    assetId: string,
    baseUrl: string,
  ): Promise<void> {
    const apiUrl = `${baseUrl}/api/v2/assets/${assetId}/hooks/`;
    const headers = [
      {
        name: `Authorization`,
        value: `Token ${token}`,
      },
    ];

    const body = {
      name: WEBHOOK_NAME,
      endpoint: KOBO_WEBHOOK_121_ENDPOINT,
      active: true,
      subset_fields: KOBO_WEBHOOK_SUBSET_FIELDS,
    };

    const response = (await this.httpService.post(
      apiUrl,
      body,
      headers,
    )) as any;

    if (response.status !== 201) {
      throw new Error(response.body);
    }
  }
}
