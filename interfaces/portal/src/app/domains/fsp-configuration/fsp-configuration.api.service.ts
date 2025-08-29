import { Injectable, Signal } from '@angular/core';

import { DomainApiService } from '~/domains/domain-api.service';
import { FspConfiguration } from '~/domains/fsp-configuration/fsp-configuration.model';

const BASE_ENDPOINT = (projectId: Signal<number | string>) => [
  'projects',
  projectId,
  'fsp-configurations',
];

@Injectable({
  providedIn: 'root',
})
export class FspConfigurationApiService extends DomainApiService {
  getFspConfigurations(projectId: Signal<number | string>) {
    return this.generateQueryOptions<FspConfiguration[]>({
      path: BASE_ENDPOINT(projectId),
    });
  }
}
