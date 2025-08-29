import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { merge } from 'lodash';

import { KoboConnectApiService } from '@121-service/src/kobo-connect/kobo-connect.api.service';
import { CreateProjectDto } from '@121-service/src/projects/dto/create-project.dto';

@Injectable()
export class KoboConnectService {
  public constructor(private koboConnectApiService: KoboConnectApiService) {}

  public async create(
    koboToken: string,
    koboAssetId: string,
    overrideProjectData?: Partial<CreateProjectDto>,
  ): Promise<CreateProjectDto | Partial<CreateProjectDto>> {
    const result = await this.koboConnectApiService.create121Project(
      koboToken,
      koboAssetId,
    );

    if (result && !('detail' in result)) {
      if (overrideProjectData) {
        // Combine the Kobo-Connect project data with overrides from the request
        return merge(result, overrideProjectData);
      }

      return result as CreateProjectDto | Partial<CreateProjectDto>;
    }

    const errors: unknown[] = [];

    if (result && result.detail) {
      errors.push(result.detail);
    }

    console.error('KoboConnectService ~ errors:', errors);

    throw new HttpException(
      {
        message: 'Kobo-Connect API did not return a result',
        errors,
      },
      HttpStatus.BAD_GATEWAY,
    );
  }
}
