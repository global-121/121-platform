import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { CreateProgramDto } from '@121-service/src/programs/dto/create-program.dto';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

interface KoboApiResponse<T = unknown> {
  data?: T | { detail: string };
  status: number;
  statusText: string;
  detail?: string;
}

function isErrorResponse(data: unknown): data is { detail: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'detail' in data &&
    typeof (data as { detail?: unknown }).detail === 'string'
  );
}

@Injectable()
export class KoboConnectApiService {
  private apiUrl = env.KOBO_CONNECT_API_URL;

  public constructor(private readonly httpService: CustomHttpService) {}

  public async create121Program(
    koboToken: string,
    koboAssetId: string,
  ): Promise<CreateProgramDto | Partial<KoboApiResponse>> {
    return await this.httpService
      .get<KoboApiResponse<CreateProgramDto>>(`${this.apiUrl}/121-program`, [
        {
          name: 'kobotoken',
          value: koboToken,
        },
        {
          name: 'koboasset',
          value: koboAssetId,
        },
      ])
      .then((response) => {
        if (
          response &&
          response.status === HttpStatus.OK &&
          response.data &&
          !isErrorResponse(response.data)
        ) {
          return response.data;
        }

        const errors: string[] = [];

        if (response && response.data && isErrorResponse(response.data)) {
          errors.push(response.data.detail);
        } else {
          errors.push(response.statusText);
        }

        throw new HttpException(
          {
            message: 'Kobo-Connect API did not return a valid response',
            errors,
          },
          HttpStatus.BAD_GATEWAY,
        );
      });
  }
}
