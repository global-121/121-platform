import { inject, Injectable, Signal } from '@angular/core';

import { queryOptions } from '@tanstack/angular-query-experimental';
import { random } from 'radashi';

import { CreateKoboDto } from '@121-service/src/kobo/dtos/create-kobo.dto';
import { KoboIntegrationResultDto } from '@121-service/src/kobo/dtos/kobo-integration-result.dto';

import { DomainApiService } from '~/domains/domain-api.service';
import { KoboIntegration } from '~/domains/kobo/kobo.model';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { getRandomDateInThePast } from '~/utils/date';
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
    // return () =>
    //   queryOptions({
    //     queryKey: this.pathToQueryKey([...BASE_ENDPOINT(programId)]).join('/'),
    //   });

    return () =>
      queryOptions<KoboIntegration>({
        queryKey: this.pathToQueryKey(BASE_ENDPOINT(programId)),
        // XXX: Remove mock response when backend is ready
        queryFn: () => ({
          id: random(1, 1000),
          created: getRandomDateInThePast(500).toISOString(),
          updated: getRandomDateInThePast(10).toISOString(),
          assetId: btoa(String(Math.random())),
          token: btoa(String(Math.random())) + btoa(String(Math.random())),
          versionId: '',
          url: 'http://kobo-url.example.org',
          dateDeployed: getRandomDateInThePast(100).toISOString(),
          programId: Number(programId()),
        }),
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

  importKoboSubmissions({ programId }: { programId: Signal<number | string> }) {
    return this.httpWrapperService.perform121ServiceRequest({
      method: 'PUT',
      endpoint: this.pathToQueryKey([
        ...BASE_ENDPOINT(programId),
        'submissions',
      ]).join('/'),
    });
  }
}
