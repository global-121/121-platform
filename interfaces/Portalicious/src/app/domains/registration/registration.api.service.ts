import { Injectable, Signal } from '@angular/core';
import { DomainApiService } from '~/domains/domain-api.service';
import {
  Registration,
  RegistrationView,
} from '~/domains/registration/registration.model';

const BASE_ENDPOINT = 'programs';

@Injectable({
  providedIn: 'root',
})
export class RegistrationApiService extends DomainApiService {
  getReferenceIdByRegistrationId(
    projectId: Signal<number>,
    registrationId: Signal<number>,
  ) {
    return this.generateQueryOptions<Registration>({
      path: [
        BASE_ENDPOINT,
        projectId,
        'registrations/referenceid',
        registrationId,
      ],
    });
  }

  getRegistrationById(
    projectId: Signal<number>,
    registrationId: Signal<number>,
  ) {
    return this.generateQueryOptions<RegistrationView>({
      path: [BASE_ENDPOINT, projectId, 'registrations', registrationId],
    });
  }

  // TODO: Do some smart stuff to invalidate the cache
  //   public invalidateCache(projectId?: Signal<number>): Promise<void> {
  //     const path: (Signal<number> | string)[] = [BASE_ENDPOINT];
  //     if (projectId) {
  //       path.push(projectId);
  //     }
  //     return this.queryClient.invalidateQueries({
  //       queryKey: this.pathToQueryKey(path),
  //     });
  //   }
}
