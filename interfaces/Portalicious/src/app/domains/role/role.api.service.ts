import { Injectable } from '@angular/core';
import { DomainApiService } from '~/domains/domain-api.service';
import { Role } from '~/domains/role/role.model';

const BASE_ENDPOINT = 'roles';

@Injectable({
  providedIn: 'root',
})
export class RoleApiService extends DomainApiService {
  getRoles() {
    return this.generateQueryOptions<Role[]>({
      path: [BASE_ENDPOINT],
    });
  }
}
