import { Injectable } from '@angular/core';

import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';

import { DomainApiService } from '~/domains/domain-api.service';
import { FinancialServiceProvider } from '~/domains/financial-service-provider/financial-service-provider.model';

const BASE_ENDPOINT = 'financial-service-providers';

@Injectable({
  providedIn: 'root',
})
export class financialServiceProviderApiService extends DomainApiService {
  getFinancialServiceProviderQuestions(
    fspName?: FinancialServiceProviders | null,
  ) {
    return this.generateQueryOptions<FinancialServiceProvider[], string[]>({
      path: [BASE_ENDPOINT],
      processResponse: (fspList) => {
        const selectedFsp = fspList.find((fsp) => fsp.name === fspName);

        if (!selectedFsp) {
          return [];
        }

        return selectedFsp.attributes.map((attribute) => attribute.name);
      },
    });
  }
}
