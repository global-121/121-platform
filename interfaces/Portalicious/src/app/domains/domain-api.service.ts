import { inject, isSignal, Signal } from '@angular/core';

import {
  injectQueryClient,
  queryOptions,
  UndefinedInitialDataOptions,
} from '@tanstack/angular-query-experimental';

import {
  HttpWrapperService,
  Perform121ServiceRequestParams,
} from '~/services/http-wrapper.service';
import {
  PaginateQuery,
  PaginateQueryService,
} from '~/services/paginate-query.service';

export abstract class DomainApiService {
  protected httpWrapperService = inject(HttpWrapperService);
  protected paginateQueryService = inject(PaginateQueryService);
  protected queryClient = injectQueryClient();

  protected pathToQueryKey = (
    path: (number | Signal<number | string | undefined> | string)[],
  ) => path.map((part) => (isSignal(part) ? part()?.toString() : part));

  protected generateQueryOptions<
    BackendDataShape,
    ProcessedResponseShape = BackendDataShape,
  >({
    path,
    processResponse,
    requestOptions = {},
    method = 'GET',
    paginateQuery,
    ...opts
  }: {
    path: Parameters<typeof DomainApiService.prototype.pathToQueryKey>[0];
    processResponse?: (data: BackendDataShape) => ProcessedResponseShape;
    requestOptions?: Omit<
      Perform121ServiceRequestParams,
      'endpoint' | 'method'
    >;
    method?: Perform121ServiceRequestParams['method'];
    paginateQuery?: Signal<PaginateQuery>;
  } & Partial<UndefinedInitialDataOptions<ProcessedResponseShape>>) {
    return () => {
      const queryKey = this.pathToQueryKey(path);
      const endpoint = queryKey.join('/');

      return queryOptions({
        ...opts,
        queryKey: [
          ...queryKey,
          method,
          endpoint,
          JSON.stringify(requestOptions),
          paginateQuery && paginateQuery(),
          processResponse,
        ],
        queryFn: async () => {
          // eslint-disable-next-line prefer-const
          let { params, ...options } = requestOptions;

          if (paginateQuery) {
            const paginateQueryParams =
              this.paginateQueryService.paginateQueryToHttpParamsObject(
                paginateQuery(),
              );

            params = {
              ...params,
              ...paginateQueryParams,
            };
          }

          const response =
            await this.httpWrapperService.perform121ServiceRequest<BackendDataShape>(
              {
                ...options,
                params,
                method,
                endpoint,
              },
            );

          return processResponse
            ? processResponse(response)
            : (response as ProcessedResponseShape);
        },
      });
    };
  }
}
