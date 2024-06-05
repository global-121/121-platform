import { KoboConnectApiService } from '@121-service/src/kobo-connect/kobo-connect.api.service';
import { CreateProgramDto } from '@121-service/src/programs/dto/create-program.dto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { merge } from 'lodash';

@Injectable()
export class KoboConnectService {
  public constructor(private koboConnectApiService: KoboConnectApiService) {}

  public async create(
    koboToken: string,
    koboAssetId: string,
    overrideProgramData?: Partial<CreateProgramDto>,
  ): Promise<CreateProgramDto> {
    const result = await this.koboConnectApiService.create121Program(
      koboToken,
      koboAssetId,
    );

    if (result && !result.detail) {
      if (overrideProgramData) {
        // Combine the Kobo-Connect program data with overrides from the request
        return merge(result, overrideProgramData);
      }

      return result;
    }

    const errors: unknown[] = [];

    if (result && result.detail) {
      errors.push(result.detail);
    }

    throw new HttpException(
      {
        message: 'Kobo-Connect API did not return a result',
        errors,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
