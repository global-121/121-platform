import { Injectable } from '@angular/core';

import { FspSettingsDto } from '@121-service/src/fsp-management/fsp-settings.dto';

import { DomainApiService } from '~/domains/domain-api.service';

@Injectable({
  providedIn: 'root',
})
export class FspApiService extends DomainApiService {
  getAllEnabledFsps() {
    return this.generateQueryOptions<FspSettingsDto[]>({
      path: ['fsps'],
    });
  }
}
