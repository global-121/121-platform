import { HttpParamsOptions } from '@angular/common/http';
import { Injectable, Signal } from '@angular/core';

import { DomainApiService } from '~/domains/domain-api.service';

const BASE_ENDPOINT = (projectId: Signal<number | string>) => [
  'projects',
  projectId,
  'registration-events',
];

@Injectable({
  providedIn: 'root',
})
export class EventApiService extends DomainApiService {
  getEvents({
    projectId,
    params,
  }: {
    projectId: Signal<number | string>;
    params: HttpParamsOptions['fromObject'];
  }) {
    return this.generateQueryOptions<Blob>({
      path: BASE_ENDPOINT(projectId),
      params,
      responseAsBlob: true,
    });
  }

  public invalidateCache(projectId: Signal<number | string>): Promise<void> {
    return this.queryClient.invalidateQueries({
      queryKey: this.pathToQueryKey(BASE_ENDPOINT(projectId)),
    });
  }
}
