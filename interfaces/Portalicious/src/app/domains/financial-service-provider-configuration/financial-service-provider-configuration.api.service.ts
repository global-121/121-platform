import { Injectable, Signal } from '@angular/core';

import { DomainApiService } from '~/domains/domain-api.service';
import { FinancialServiceProviderConfiguration } from '~/domains/financial-service-provider-configuration/financial-service-provider-configuration.model';

const BASE_ENDPOINT = (projectId: Signal<number>) => [
  'programs',
  projectId,
  'financial-service-provider-configurations',
];

@Injectable({
  providedIn: 'root',
})
export class FinancialServiceProviderConfigurationApiService extends DomainApiService {
  getFinancialServiceProviderConfigurations(projectId: Signal<number>) {
    return this.generateQueryOptions<FinancialServiceProviderConfiguration[]>({
      path: BASE_ENDPOINT(projectId),
    });
  }
}
