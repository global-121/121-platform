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

  /**
   * Takes an array that could contain signals, and converts it to a tanstack-query-friendy
   * key array.
   *
   * @param path - array of path parts that, when joined, become the endpoint being called
   * @returns a query key array that can be passed on to tanstack-query
   */
  protected pathToQueryKey = (
    path: (number | Signal<number | string | undefined> | string)[],
  ) => path.map((part) => (isSignal(part) ? part()?.toString() : part));

  /**
   * Generates query options for tanstack-query's `injectQuery` function.
   *
   * This function is designed to be used in domain-specific API services that
   * extend this base `DomainApiService` class. It abstracts away the common logic
   * needed to create query options, allowing derived services to easily set up
   * queries with custom parameters, response processing, and pagination.
   *
   * @param path - array of path parts that, when joined, become the endpoint being called
   * @param processResponse - optional function to process the backend response before returning it
   * @param params - optional query parameters to include in the request
   * @param responseAsBlob - whether to treat the response as a Blob (default: false)
   * @param method - HTTP method to use for the request (default: 'GET')
   * @param paginateQuery - optional signal containing pagination, filtering, and sorting info
   * @param ...opts - the parameters object can also contain any additional options that can be passed on to tanstack-query's `queryOptions` function
   * @returns queryOptions that can be passed on to tanstack's `injectQuery` function
   */
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
  } &
    // this "& Partial<...>" allows the caller of this function to pass-through
    // any additional options to the `queryOptions` function. These additional
    // options will end up in `...opts` above.
    // (For example, this is used often for the `enabled` property)
    Partial<UndefinedInitialDataOptions<ProcessedResponseShape>>) {
    return () => {
      // This conversion from pathToQueryKey needs to happen within this anonymous function.
      // If it is done elsewhere (eg. before the anonymous function, or outside of the
      // generateQueryOptions function altogether), then tanstack-query will not pick up
      // on changes to signals passed into `path`, and therefore, it will not reload the query appropriately.
      const queryKey = this.pathToQueryKey(path);
      const endpoint = queryKey.join('/');
      // The same applies to "deSignalising" the params. If it is not done within this function, tanstack-query
      // will not pick up on the changes.
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
