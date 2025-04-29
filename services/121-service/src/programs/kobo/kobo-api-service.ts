import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { KoboChoice } from '@121-service/src/programs/kobo/interfaces/kobo-choice.interface';
import { KoboSurveyItem } from '@121-service/src/programs/kobo/interfaces/kobo-survey-item.interface';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

/**
 * Response from Kobo API containing form definition and metadata
 */
export interface KoboFormResponse {
  survey: KoboSurveyItem[];
  choices: KoboChoice[];
  languages: string[];
  dateDeployed: Date;
  versionId: string;
}

/**
 * Service that handles all communication with Kobo API
 */
@Injectable()
export class KoboApiService {
  constructor(private readonly httpService: CustomHttpService) {}

  public async getKoboSubmissionData(
    token: string,
    assetId: string,
    baseUrl: string,
  ): Promise<Record<string, any>[]> {
    console.log('Fetching Kobo registrations for asset:', assetId);

    const apiUrl = `${baseUrl}/api/v2/assets/${assetId}/data/`;
    const headers = [
      {
        name: `Authorization`,
        value: `Token ${token}`,
      },
    ];

    try {
      const response = (await this.httpService.get(apiUrl, headers)) as any;
      const responseBody = response.data;

      if (response.status !== 200) {
        throw new HttpException(
          `Failed to fetch Kobo registrations: ${responseBody.detail || 'Unknown error'}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      console.log(`Found ${responseBody.results?.length || 0} registrations`);

      return responseBody.results || [];
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

  public async getKoboInformation(
    token: string,
    assetId: string,
    baseUrl: string,
  ): Promise<KoboFormResponse> {
    const apiUrl = `${baseUrl}/api/v2/assets/${assetId}/?format=json`;
    const headers = [
      {
        name: `Authorization`,
        value: `Token ${token}`,
      },
    ];

    try {
      const response = (await this.httpService.get(apiUrl, headers)) as any;
      const responseBody = response.data;

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
        survey: responseBody.content.survey || [],
        choices: responseBody.content.choices || [],
        languages: responseBody.summary.languages || [],
        dateDeployed: responseBody.date_deployed,
        versionId: responseBody.version_id,
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
}
