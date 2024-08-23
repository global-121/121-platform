import { inject, Signal } from '@angular/core';
import {
  injectQueryClient,
  queryOptions,
  UndefinedInitialDataOptions,
} from '@tanstack/angular-query-experimental';
import { HttpWrapperService } from '~/services/http-wrapper.service';

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
    ...opts
  }: {
    path: Parameters<typeof DomainApiService.prototype.pathToQueryKey>[0];
    processResponse?: (data: BackendDataShape) => ProcessedResponseShape;
  } & Partial<UndefinedInitialDataOptions<ProcessedResponseShape>>) {
    return () => {
      console.log('path', path);
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
                method: 'GET',
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
