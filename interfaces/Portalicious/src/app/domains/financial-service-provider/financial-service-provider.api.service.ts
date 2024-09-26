import { Injectable } from '@angular/core';

import { DomainApiService } from '~/domains/domain-api.service';
import { FinancialServiceProvider } from '~/domains/financial-service-provider/financial-service-provider.model';

const BASE_ENDPOINT = 'financial-service-providers';

@Injectable({
  providedIn: 'root',
})
export class financialServiceProviderApiService extends DomainApiService {
  getFinancialServiceProviderQuestions(fspName: null | string | undefined) {
    return this.generateQueryOptions<FinancialServiceProvider[], string[]>({
      path: [BASE_ENDPOINT],
      processResponse: (fspList) => {
        const selectedFsp = fspList.find((fsp) => fsp.fsp === fspName);

        if (!selectedFsp) {
          return [];
        }

        return selectedFsp.questions.map((question) => question.name);
      },
    });
  }
}
