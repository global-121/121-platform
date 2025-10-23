import { inject, Injectable, Signal } from '@angular/core';

import { queryOptions } from '@tanstack/angular-query-experimental';

import { KoboLinkFormResponseDto } from '@121-service/src/programs/kobo/dto/kobo-link-form-reponse.dto';
import { LinkKoboDto } from '@121-service/src/programs/kobo/dto/link-kobo.dto';

import { DomainApiService } from '~/domains/domain-api.service';
import { KoboIntegration } from '~/domains/kobo/kobo.model';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { Dto } from '~/utils/dto-type';

const BASE_ENDPOINT = (projectId: Signal<number | string>) => [
  'programs',
  projectId,
  'kobo',
];

@Injectable({
  providedIn: 'root',
})
export class KoboApiService extends DomainApiService {
  readonly projectApiService = inject(ProjectApiService);

  getKoboIntegration(projectId: Signal<number | string>) {
    return () =>
      queryOptions<KoboIntegration>({
        queryKey: this.pathToQueryKey(BASE_ENDPOINT(projectId)),
        // XXX: Remove mock response when backend is ready
        queryFn: () => ({
          id: 1,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          assetId: '',
          tokenCode: '',
          versionId: '',
          url: 'http://kobo-url.org',
          dateDeployed: new Date().toISOString(),
          programId: Number(projectId()),
        }),
      });
  }

  createKoboIntegration({
    projectId,
    integration,
    dryRun,
  }: {
    projectId: Signal<number | string>;
    integration: Dto<LinkKoboDto>;
    dryRun: boolean;
  }) {
    return this.httpWrapperService.perform121ServiceRequest<
      Dto<KoboLinkFormResponseDto>
    >({
      method: 'POST',
      endpoint: this.pathToQueryKey([...BASE_ENDPOINT(projectId)]).join('/'),
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

  public invalidateCache(projectId: Signal<number | string>): Promise<void> {
    return this.queryClient.invalidateQueries({
      queryKey: this.pathToQueryKey(BASE_ENDPOINT(projectId)),
    });
  }
}
