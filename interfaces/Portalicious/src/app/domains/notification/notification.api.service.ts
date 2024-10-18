import { Injectable, Signal } from '@angular/core';

import { DomainApiService } from '~/domains/domain-api.service';
import { MessageTemplate } from '~/domains/notification/notification.helper';

const BASE_ENDPOINT = (projectId: Signal<number>) => [
  'notifications',
  projectId,
];

@Injectable({
  providedIn: 'root',
})
export class NotificationApiService extends DomainApiService {
  getMessageTemplates(projectId: Signal<number | undefined>) {
    return this.generateQueryOptions<MessageTemplate[]>({
      path: [
        ...BASE_ENDPOINT(projectId as Signal<number>),
        'message-templates',
      ],
      enabled: () => !!projectId(),
    });
  }

  public invalidateMessageTemplates(projectId: Signal<number>): Promise<void> {
    const path = [...BASE_ENDPOINT(projectId), 'message-templates'];

    return this.queryClient.invalidateQueries({
      queryKey: this.pathToQueryKey(path),
    });
  }
}
