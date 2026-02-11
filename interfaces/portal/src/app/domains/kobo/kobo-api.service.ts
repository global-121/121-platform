import { inject, Injectable, Signal } from '@angular/core';

import { CreateKoboDto } from '@121-service/src/kobo/dtos/create-kobo.dto';
import { KoboIntegrationResultDto } from '@121-service/src/kobo/dtos/kobo-integration-result.dto';
import { KoboResponseDto } from '@121-service/src/kobo/dtos/kobo-response.dto';

import { DomainApiService } from '~/domains/domain-api.service';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { Dto } from '~/utils/dto-type';

const BASE_ENDPOINT = (programId: Signal<number | string>) => [
  'programs',
  programId,
  'kobo',
];

@Injectable({
  providedIn: 'root',
})
export class KoboApiService extends DomainApiService {
  readonly programApiService = inject(ProgramApiService);

  getKoboIntegration(programId: Signal<number | string>) {
    return this.generateQueryOptions<KoboResponseDto>({
      path: BASE_ENDPOINT(programId),
      queryKey: this.pathToQueryKey(BASE_ENDPOINT(programId)),
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

  importKoboSubmissions({ projectId }: { projectId: Signal<number | string> }) {
    return this.httpWrapperService.perform121ServiceRequest({
      method: 'PUT',
      endpoint: this.pathToQueryKey([
        ...BASE_ENDPOINT(projectId),
        'submissions',
      ]).join('/'),
    });
  }
}
