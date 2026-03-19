import { HttpStatusCode } from '@angular/common/http';
import { Injectable, Signal } from '@angular/core';

import { CreateKoboDto } from '@121-service/src/kobo/dtos/create-kobo.dto';
import { KoboImportSubmissionsResultDto } from '@121-service/src/kobo/dtos/kobo-import-submissions-result.dto';
import { KoboIntegrationResultDto } from '@121-service/src/kobo/dtos/kobo-integration-result.dto';
import { KoboResponseDto } from '@121-service/src/kobo/dtos/kobo-response.dto';

import { DomainApiService } from '~/domains/domain-api.service';
import { Dto } from '~/utils/dto-type';
import { isErrorWithStatusCode } from '~/utils/is-error-with-status-code.helper';

const BASE_ENDPOINT = (programId: Signal<number | string>) => [
  'programs',
  programId,
  'kobo',
];

@Injectable({
  providedIn: 'root',
})
export class KoboApiService extends DomainApiService {
  getKoboIntegration(programId: Signal<number | string>) {
    return this.generateQueryOptions<KoboResponseDto>({
      path: BASE_ENDPOINT(programId),
      throwOnError: false,
      retry: (failureCount, error) => {
        // If the integration is explicitly not found, we don't want/need to retry.
        if (
          isErrorWithStatusCode({ error, statusCode: HttpStatusCode.NotFound })
        ) {
          return false;
        }
        return failureCount < 3;
      },
    });
  }

  createKoboIntegration({
    programId,
    integration,
    dryRun,
  }: {
    programId: Signal<number | string>;
    integration: Dto<CreateKoboDto>;
    dryRun: boolean;
  }) {
    return this.httpWrapperService.perform121ServiceRequest<
      Dto<KoboIntegrationResultDto>
    >({
      method: 'POST',
      endpoint: this.pathToQueryKey([...BASE_ENDPOINT(programId)]).join('/'),
      body: integration,
      httpParams: {
        dryRun,
      },
    });
  }

  importExistingSubmissions({
    programId,
  }: {
    programId: Signal<number | string>;
  }) {
    return this.httpWrapperService.perform121ServiceRequest<
      Dto<KoboImportSubmissionsResultDto>
    >({
      method: 'POST',
      endpoint: this.pathToQueryKey([
        ...BASE_ENDPOINT(programId),
        'import',
      ]).join('/'),
    });
  }
}
