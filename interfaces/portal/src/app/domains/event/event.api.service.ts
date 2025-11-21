import { HttpParamsOptions } from '@angular/common/http';
import { Injectable, Signal } from '@angular/core';

import { DomainApiService } from '~/domains/domain-api.service';
import { FindAllRegistrationEventsResult } from '~/domains/event/event.model';
import { PaginateQuery } from '~/services/paginate-query.service';

const BASE_ENDPOINT = (programId: Signal<number | string>) => [
  'programs',
  programId,
  'registration-events',
];

@Injectable({
  providedIn: 'root',
})
export class EventApiService extends DomainApiService {
  getEvents({
    programId,
    params,
  }: {
    programId: Signal<number | string>;
    params: HttpParamsOptions['fromObject'];
  }) {
    return this.generateQueryOptions<Blob>({
      path: BASE_ENDPOINT(programId),
      params,
      responseAsBlob: true,
    });
  }

  // ##TODO this will be combined with above endpoint into one
  getEventsPaginated({
    programId,
    paginateQuery,
  }: {
    programId: Signal<number | string>;
    paginateQuery: Signal<PaginateQuery | undefined>;
  }) {
    return this.generateQueryOptions<FindAllRegistrationEventsResult>({
      path: [...BASE_ENDPOINT(programId), 'paginated'],
      paginateQuery: paginateQuery as Signal<PaginateQuery>,
      enabled: () => !!paginateQuery(),
    });
  }

  public invalidateCache(programId: Signal<number | string>): Promise<void> {
    return this.queryClient.invalidateQueries({
      queryKey: this.pathToQueryKey(BASE_ENDPOINT(programId)),
    });
  }
}
