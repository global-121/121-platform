import { HttpParams } from '@angular/common/http';
import { Injectable, Signal } from '@angular/core';

import { DomainApiService } from '~/domains/domain-api.service';
import { Registration } from '~/domains/registration/registration.model';

const BASE_ENDPOINT = (projectId: Signal<number>) => [
  'programs',
  projectId,
  'registrations',
];

@Injectable({
  providedIn: 'root',
})
export class RegistrationApiService extends DomainApiService {
  getManyByQuery(projectId: Signal<number>) {
    // XXX: the query shouldn't be defined here. This should be removed / refactored when the registrations page is built.
    let params = new HttpParams();
    params = params.append('limit', 10);
    params = params.append('page', 1);

    return this.generateQueryOptions<{
      data: Registration[];
    }>({
      path: [...BASE_ENDPOINT(projectId)],
      requestOptions: {
        params,
      },
    });
  }

  getRegistrationById(
    projectId: Signal<number>,
    registrationId: Signal<number>,
  ) {
    return this.generateQueryOptions<Registration>({
      path: [...BASE_ENDPOINT(projectId), registrationId],
    });
  }

  public invalidateCache(
    projectId: Signal<number>,
    registrationId?: Signal<number>,
  ): Promise<void> {
    const path = [...BASE_ENDPOINT(projectId)];

    if (registrationId) {
      path.push(registrationId);
    }

    return this.queryClient.invalidateQueries({
      queryKey: this.pathToQueryKey(path),
    });
  }
}
