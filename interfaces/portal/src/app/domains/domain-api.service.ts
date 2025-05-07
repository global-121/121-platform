import { inject, isSignal, Signal } from '@angular/core';

import {
  QueryClient,
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
  protected queryClient = inject(QueryClient);

  protected pathToQueryKey = (
    path: (number | Signal<number | string | undefined> | string)[],
  ) => path.map((part) => (isSignal(part) ? part()?.toString() : part));

  protected generateQueryOptions<
    BackendDataShape,
    ProcessedResponseShape = BackendDataShape,
  >({
    path,
    processResponse,
    params = {},
    responseAsBlob = false,
    method = 'GET',
    paginateQuery,
    ...opts
  }: {
    path: Parameters<typeof DomainApiService.prototype.pathToQueryKey>[0];
    processResponse?: (data: BackendDataShape) => ProcessedResponseShape;
    params?: Record<
      string,
      | boolean
      | number
      | readonly (boolean | number | string)[]
      | Signal<
          boolean | number | readonly (boolean | number | string)[] | string
        >
      | string
    >;
    responseAsBlob?: boolean;
    method?: Perform121ServiceRequestParams['method'];
    paginateQuery?: Signal<PaginateQuery>;
  } & Partial<UndefinedInitialDataOptions<ProcessedResponseShape>>) {
    return () => {
      const queryKey = this.pathToQueryKey(path);
      const endpoint = queryKey.join('/');
      const deSignalizedParams = Object.fromEntries(
        Object.entries(params).map(([key, value]) => [
          key,
          isSignal(value) ? value() : value,
        ]),
      );

      return queryOptions({
        ...opts,
        queryKey: [
          ...queryKey,
          method,
          endpoint,
          deSignalizedParams,
          responseAsBlob,
          paginateQuery && paginateQuery(),
          processResponse,
        ],
        queryFn: async () => {
          let httpParams = {
            ...deSignalizedParams,
          };

          if (paginateQuery) {
            const paginateQueryParams =
              this.paginateQueryService.paginateQueryToHttpParamsObject(
                paginateQuery(),
              );

            httpParams = {
              ...httpParams,
              ...paginateQueryParams,
            };
          }

          const response =
            await this.httpWrapperService.perform121ServiceRequest<BackendDataShape>(
              {
                responseAsBlob,
                httpParams,
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
