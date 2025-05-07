import { Injectable } from '@angular/core';

import { DomainApiService } from '~/domains/domain-api.service';
import { VersionInfo } from '~/domains/health/health.model';

const BASE_ENDPOINT = 'health';

@Injectable({
  providedIn: 'root',
})
export class HealthApiService extends DomainApiService {
  getVersionInfo() {
    return this.generateQueryOptions<VersionInfo>({
      path: [BASE_ENDPOINT, 'version'],
    });
  }
}
