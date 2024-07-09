import { Injectable, inject } from '@angular/core';
import { VersionInfo } from '~/models/health.model';
import { HttpWrapperService } from '~/services/http-wrapper.service';

export enum ApiEndpoints {
  versionInfo = 'health/version',
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private httpWrapperService = inject(HttpWrapperService);

  getVersionInfo() {
    return this.httpWrapperService.perform121ServiceRequest<VersionInfo>({
      method: 'GET',
      endpoint: ApiEndpoints.versionInfo,
    });
  }
}
