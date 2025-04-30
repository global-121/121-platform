import { Injectable, Signal } from '@angular/core';

import { KoboLinkFormResponseDto } from '@121-service/src/programs/kobo/dto/kobo-link-form-reponse.dto';
import { LinkKoboDto } from '@121-service/src/programs/kobo/dto/link-kobo.dto';

import { DomainApiService } from '~/domains/domain-api.service';
import { KoboIntegration } from '~/domains/kobo/kobo.model';
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
  getKoboIntegration(projectId: Signal<number | string>) {
    return this.generateQueryOptions<KoboIntegration>({
      path: BASE_ENDPOINT(projectId),
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

  public invalidateCache(projectId: Signal<number | string>): Promise<void> {
    return this.queryClient.invalidateQueries({
      queryKey: this.pathToQueryKey(BASE_ENDPOINT(projectId)),
    });
  }
}
