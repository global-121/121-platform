import { inject, Signal } from '@angular/core';

import {
  injectQueryClient,
  queryOptions,
  UndefinedInitialDataOptions,
} from '@tanstack/angular-query-experimental';

import {
  HttpWrapperService,
  Perform121ServiceRequestParams,
} from '~/services/http-wrapper.service';

export abstract class DomainApiService {
  protected httpWrapperService = inject(HttpWrapperService);
  protected queryClient = injectQueryClient();

  protected pathToQueryKey = (
    path: (Signal<number | string | undefined> | string)[],
  ) =>
    path.map((part) => (typeof part === 'string' ? part : part()?.toString()));

  protected generateQueryOptions<
    BackendDataShape,
    ProcessedResponseShape = BackendDataShape,
  >({
    path,
    processResponse,
    requestOptions = {},
    method = 'GET',
    ...opts
  }: {
    path: Parameters<typeof DomainApiService.prototype.pathToQueryKey>[0];
    processResponse?: (data: BackendDataShape) => ProcessedResponseShape;
    requestOptions?: Omit<
      Perform121ServiceRequestParams,
      'endpoint' | 'method'
    >;
    method?: Perform121ServiceRequestParams['method'];
  } & Partial<UndefinedInitialDataOptions<ProcessedResponseShape>>) {
    return () => {
      const queryKey = this.pathToQueryKey(path);
      const endpoint = queryKey.join('/');

      return queryOptions({
        ...opts,
        // eslint-disable-next-line @tanstack/query/exhaustive-deps
        queryKey,
        queryFn: async () => {
          const response =
            await this.httpWrapperService.perform121ServiceRequest<BackendDataShape>(
              {
                ...requestOptions,
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
