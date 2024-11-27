import { Injectable } from '@angular/core';

import { DomainApiService } from '~/domains/domain-api.service';
import { FinancialServiceProvider } from '~/domains/financial-service-provider/financial-service-provider.model';

const BASE_ENDPOINT = 'financial-service-providers';

@Injectable({
  providedIn: 'root',
})
export class FinancialServiceProviderApiService extends DomainApiService {
  getFinancialServiceProviders() {
    return this.generateQueryOptions<FinancialServiceProvider[]>({
      path: [BASE_ENDPOINT],
    });
  }
}
