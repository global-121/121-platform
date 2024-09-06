import { Injectable, Signal } from '@angular/core';
import { DomainApiService } from '~/domains/domain-api.service';
import {
  Message,
  Registration,
  RegistrationActivityLogEntry,
  RegistrationEvent,
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

  getRegistrationReferenceId(
    projectId: Signal<number | undefined>,
    registrationId: Signal<number | undefined>,
  ) {
    return this.generateQueryOptions<Registration, string>({
      path: [
        BASE_ENDPOINT,
        projectId,
        'registrations/referenceid',
        registrationId,
      ],
      processResponse: (registration) => {
        return registration.referenceId;
      },
      enabled: () => !!projectId() && !!registrationId(),
    });
  }

  getMessageHistory(
    projectId: Signal<number | undefined>,
    referenceId: string,
  ) {
    return this.generateQueryOptions<Message[], RegistrationActivityLogEntry[]>(
      {
        path: [
          BASE_ENDPOINT,
          projectId,
          'registrations',
          'message-history',
          referenceId || '',
        ],
        processResponse: (messages) =>
          messages.map((message) => ({
            //TODO: find a better way? id needed for expanding table row
            id: crypto.randomUUID(),
            activityType: 'message',
            overview: message.type,
            doneBy: message.user.username || 'Unknown',
            timestamp: new Date(message.created),
            details: message.body,
          })),
        enabled: () => !!projectId() && !!referenceId,
        initialData: undefined,
      },
    );
  }

  getRegistrationEvents(
    projectId: Signal<number | undefined>,
    registartionId: Signal<number | undefined>,
  ) {
    return this.generateQueryOptions<
      RegistrationEvent[],
      RegistrationActivityLogEntry[]
    >({
      path: [
        BASE_ENDPOINT,
        projectId,
        'registrations',
        registartionId,
        'events',
      ],
      processResponse: (registrationEvents) =>
        registrationEvents.map((registrationEvent) => ({
          //TODO: find a better way? id needed for expanding table row
          id: crypto.randomUUID(),
          activityType: registrationEvent.type,
          overview: Object.keys(registrationEvent.attributes)
            // TODO: avoid disabling rule
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            .map((key) => `${key}: ${registrationEvent.attributes[key]}`)
            .join(', '),
          doneBy: registrationEvent.user.username ?? 'Unknown',
          timestamp: new Date(registrationEvent.created),
          details: 'TODO: Implement event details',
        })),
      enabled: () => !!projectId() && !!registartionId(),
      initialData: undefined,
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
