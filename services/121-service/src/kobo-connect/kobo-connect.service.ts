import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { merge } from 'lodash';
import { CreateProgramDto } from '../programs/dto/create-program.dto';
import { KoboConnectApiService } from './kobo-connect.api.service';

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

    const errors = [];

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
