import { HttpParams } from '@angular/common/http';
import { Injectable, Signal } from '@angular/core';

import { DomainApiService } from '~/domains/domain-api.service';

const BASE_ENDPOINT = (projectId: Signal<number>) => [
  'programs',
  projectId,
  'events',
];

@Injectable({
  providedIn: 'root',
})
export class EventApiService extends DomainApiService {
  getEvents({
    projectId,
    params,
  }: {
    projectId: Signal<number>;
    params: HttpParams;
  }) {
    return this.generateQueryOptions<Blob>({
      path: BASE_ENDPOINT(projectId),
      requestOptions: {
        params,
        responseAsBlob: true,
      },
    });
  }

  public invalidateCache(projectId: Signal<number>): Promise<void> {
    return this.queryClient.invalidateQueries({
      queryKey: this.pathToQueryKey(BASE_ENDPOINT(projectId)),
    });
  }
}
