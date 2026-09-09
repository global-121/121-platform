import { HttpStatusCode } from '@angular/common/http';
import { Injectable, Signal } from '@angular/core';

import { ActivityInfoIntegrationResultDto } from '@121-service/src/activityinfo/dtos/activityinfo-integration-result.dto';
import { ActivityInfoResponseDto } from '@121-service/src/activityinfo/dtos/activityinfo-response.dto';
import { CreateActivityInfoDto } from '@121-service/src/activityinfo/dtos/create-activityinfo.dto';
import { ImportExistingRecordsResultDto } from '@121-service/src/activityinfo/dtos/import-existing-records-result.dto';

import { DomainApiService } from '~/domains/domain-api.service';
import { Dto } from '~/utils/dto-type';
import { isErrorWithStatusCode } from '~/utils/is-error-with-status-code.helper';

const BASE_ENDPOINT = (programId: Signal<number | string>) => [
  'programs',
  programId,
  'activityinfo',
];

@Injectable({
  providedIn: 'root',
})
export class ActivityInfoApiService extends DomainApiService {
  getActivityInfoIntegration(programId: Signal<number | string>) {
    return this.generateQueryOptions<ActivityInfoResponseDto>({
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

  upsertActivityInfoIntegration({
    programId,
    integration,
    dryRun,
  }: {
    programId: Signal<number | string>;
    integration: Dto<CreateActivityInfoDto>;
    dryRun: boolean;
  }) {
    return this.httpWrapperService.perform121ServiceRequest<
      Dto<ActivityInfoIntegrationResultDto>
    >({
      method: 'PUT',
      endpoint: this.pathToQueryKey([...BASE_ENDPOINT(programId)]).join('/'),
      body: integration,
      httpParams: {
        dryRun,
      },
    });
  }

  refreshActivityInfoForm(programId: Signal<number | string>) {
    return this.httpWrapperService.perform121ServiceRequest<
      Dto<ActivityInfoIntegrationResultDto>
    >({
      method: 'PATCH',
      endpoint: this.pathToQueryKey([...BASE_ENDPOINT(programId)]).join('/'),
    });
  }

  importExistingRecords(programId: Signal<number | string>) {
    return this.httpWrapperService.perform121ServiceRequest<
      Dto<ImportExistingRecordsResultDto>
    >({
      method: 'PATCH',
      endpoint: this.pathToQueryKey([
        ...BASE_ENDPOINT(programId),
        'records',
      ]).join('/'),
    });
  }
}
