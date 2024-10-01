import { HttpParams } from '@angular/common/http';
import { Injectable, Signal } from '@angular/core';

import { queryOptions } from '@tanstack/angular-query-experimental';
import { uniqueId } from 'lodash';

import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';

import { DomainApiService } from '~/domains/domain-api.service';
import { REGISTRATION_STATUS_LABELS } from '~/domains/registration/registration.helper';
import { ACTIVITY_LOG_ITEM_TYPE_LABELS } from '~/domains/registration/registration.helper';
import {
  ActivityLogItemType,
  ActivityLogItemWithOverview,
  DataChangeActivity,
  MessageActivity,
  NoteActivity,
  Registration,
  StatusUpdateActivity,
  TransferActivity,
} from '~/domains/registration/registration.model';

const BASE_ENDPOINT = (projectId: Signal<number>) => [
  'programs',
  projectId,
  'registrations',
];

@Injectable({
  providedIn: 'root',
})
export class RegistrationApiService extends DomainApiService {
  getManyByQuery(projectId: Signal<number>) {
    // TODO: AB#28791 the query shouldn't be defined here. This should be removed / refactored when the registrations page is built.
    let params = new HttpParams();
    params = params.append('limit', 10);
    params = params.append('page', 1);

    return this.generateQueryOptions<{
      data: Registration[];
    }>({
      path: [...BASE_ENDPOINT(projectId)],
      requestOptions: {
        params,
      },
    });
  }

  getRegistrationById(
    projectId: Signal<number>,
    registrationId: Signal<number>,
  ) {
    return this.generateQueryOptions<Registration>({
      path: [...BASE_ENDPOINT(projectId), registrationId],
    });
  }

  getActivityLog(projectId: Signal<number>, registrationId: Signal<number>) {
    return () => {
      // TODO: AB#29984 - Implement the activity log endpoint
      // and use the 'generateQueryOptions' method instead of hardcoding the data here.
      const path = [
        ...BASE_ENDPOINT(projectId),
        registrationId,
        'activity-log',
      ];
      return queryOptions({
        // eslint-disable-next-line @tanstack/query/exhaustive-deps
        queryKey: this.pathToQueryKey(path),
        queryFn: async () => {
          // fake a bit of a delay
          await new Promise((resolve) => setTimeout(resolve, 100));

          // lots of fake data to be removed when the endpoint is implemented

          const dataChanges: DataChangeActivity[] = [
            {
              id: uniqueId(),
              author: 'sanne@redcross.nl',
              date: new Date(new Date().getTime() - Math.random() * 1e12),
              activityType: ActivityLogItemType.DataChange,
              contents: {
                changeReason: 'Data was incorrect',
                dataType: 'Phone number',
                oldData: '123456789',
                newData: '987654321',
              },
            },
            {
              id: uniqueId(),
              author: 'tijs@redcross.nl',
              date: new Date(new Date().getTime() - Math.random() * 1e12),
              activityType: ActivityLogItemType.DataChange,
              contents: {
                changeReason: 'Moved house',
                dataType: 'Address',
                oldData: '123 Fake Street',
                newData: '456 Real Street',
              },
            },
          ];

          const messages: MessageActivity[] = [
            {
              id: uniqueId(),
              author: 'dom@redcross.nl',
              date: new Date(new Date().getTime() - Math.random() * 1e12),
              activityType: ActivityLogItemType.Message,
              contents: {
                message: 'Custom message',
                messageType: 'Custom Message',
              },
            },
          ];

          const notes: NoteActivity[] = [
            {
              id: uniqueId(),
              author: 'dom@redcross.nl',
              date: new Date(new Date().getTime() - Math.random() * 1e12),
              activityType: ActivityLogItemType.Note,
              contents: {
                note: 'This is a note',
              },
            },
          ];

          const statusChanges: StatusUpdateActivity[] = [
            {
              id: uniqueId(),
              author: 'dom@redcross.nl',
              date: new Date(new Date().getTime() - Math.random() * 1e12),
              activityType: ActivityLogItemType.StatusUpdate,
              contents: {
                oldStatus: RegistrationStatusEnum.registered,
                newStatus: RegistrationStatusEnum.included,
              },
            },
            {
              id: uniqueId(),
              author: 'sanne@redcross.nl',
              date: new Date(new Date().getTime() - Math.random() * 1e12),
              activityType: ActivityLogItemType.StatusUpdate,
              contents: {
                oldStatus: RegistrationStatusEnum.included,
                newStatus: RegistrationStatusEnum.validated,
              },
            },
            {
              id: uniqueId(),
              author: 'finance@redcross.nl',
              date: new Date(new Date().getTime() - Math.random() * 1e12),
              activityType: ActivityLogItemType.StatusUpdate,
              contents: {
                oldStatus: RegistrationStatusEnum.validated,
                newStatus: RegistrationStatusEnum.declined,
              },
            },
          ];

          const transfers: TransferActivity[] = [
            {
              id: uniqueId(),
              author: 'finance@redcross.nl',
              date: new Date(new Date().getTime() - Math.random() * 1e12),
              activityType: ActivityLogItemType.Transfer,
              contents: {
                payment: 2,
                referenceId: '4212e8b29521366838192e87811de5bc',
                totalTransfers: 2,
                status: StatusEnum.waiting,
                amount: 100,
                sent: new Date(),
                received: new Date(),
                fsp: FinancialServiceProviderName.intersolveVisa,
                approvedBy: 'Samer@financial',
              },
            },
            {
              id: uniqueId(),
              author: 'finance@redcross.nl',
              date: new Date(new Date().getTime() - Math.random() * 1e12),
              activityType: ActivityLogItemType.Transfer,
              contents: {
                payment: 1,
                referenceId: '4212e8b29521366838192e87811de5bc',
                totalTransfers: 2,
                status: StatusEnum.success,
                amount: 100,
                sent: new Date(),
                received: new Date(),
                fsp: FinancialServiceProviderName.intersolveVoucherWhatsapp,
                approvedBy: 'Samer@financial',
              },
            },
          ];

          const items: ActivityLogItemWithOverview[] = [
            ...dataChanges,
            ...messages,
            ...notes,
            ...statusChanges,
            ...transfers,
          ]
            // TODO: AB#29984 - this map should probably be moved to a "processResponse" once the API is hooked up
            // it can't be generated on the backend because we need to localize some strings
            .map((item) => {
              switch (item.activityType) {
                case ActivityLogItemType.DataChange:
                  return {
                    ...item,
                    overview: item.contents.dataType,
                  };
                case ActivityLogItemType.Message:
                  return {
                    ...item,
                    overview: item.contents.messageType,
                  };
                case ActivityLogItemType.Note:
                  return {
                    ...item,
                    overview: item.contents.note,
                  };
                case ActivityLogItemType.StatusUpdate:
                  return {
                    ...item,
                    overview:
                      REGISTRATION_STATUS_LABELS[item.contents.newStatus],
                  };
                case ActivityLogItemType.Transfer:
                  return {
                    ...item,
                    overview: $localize`${ACTIVITY_LOG_ITEM_TYPE_LABELS[item.activityType]}:activityType: ${item.contents.payment}:count: of ${item.contents.totalTransfers}:totalCount:`,
                  };
              }
            })
            .sort((a, b) => b.date.getTime() - a.date.getTime());

          return {
            data: items,
            meta: {
              count: {
                'data-change': dataChanges.length,
                message: messages.length,
                note: notes.length,
                'status-update': statusChanges.length,
                transfer: transfers.length,
              },
            },
          };
        },
      });
    };
  }

  public invalidateCache(
    projectId: Signal<number>,
    registrationId?: Signal<number>,
  ): Promise<void> {
    const path = [...BASE_ENDPOINT(projectId)];

    if (registrationId) {
      path.push(registrationId);
    }

    return this.queryClient.invalidateQueries({
      queryKey: this.pathToQueryKey(path),
    });
  }
}
