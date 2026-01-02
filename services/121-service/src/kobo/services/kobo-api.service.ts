import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';

import { KoboAssetResponseDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-asset-response.dto';
import { KoboFormDefinition } from '@121-service/src/kobo/interfaces/kobo-form-definition.interface';
import { KoboMapper } from '@121-service/src/kobo/mappers/kobo.mapper';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Injectable()
export class KoboApiService {
  public constructor(private readonly httpService: CustomHttpService) {}

  public async getDeployedAssetOrThrow({
    assetId,
    token,
    baseUrl,
  }: {
    assetId: string;
    token: string;
    baseUrl: string;
  }): Promise<KoboFormDefinition> {
    const apiUrl = `${baseUrl}/api/v2/assets/${assetId}/deployment/?format=json`;
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
        `Unauthorized access to Kobo API for asset: ${assetId}. Please check if the provided token is valid.`,
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (response.status === HttpStatus.NOT_FOUND) {
      throw new HttpException(
        `Kobo information not found for asset: ${assetId}. This form does not exist or is not (yet) deployed.`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Unexpected error
    if (response.status !== HttpStatus.OK) {
      throw new HttpException(
        `Failed to fetch Kobo information: ${responseBody.detail || 'Unknown error'}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // This should never happen but it makes TypeScript happy and throws a meaningful error
    if (!responseBody.version_id || !responseBody.asset) {
      throw new Error('Kobo information is missing version_id or asset');
    }

    const surveyItemsCleaned = KoboMapper.surveyItemsDtosToInterfaces({
      koboSurveyItems: responseBody.asset.content.survey || [],
    });
    return {
      name: responseBody.asset.name ?? '',
      survey: surveyItemsCleaned,
      choices: responseBody.asset.content.choices || [],
      languages: responseBody.asset.summary.languages || [],
      dateDeployed: responseBody.asset.date_deployed,
      versionId: responseBody.asset.version_id,
    };
  }
}
