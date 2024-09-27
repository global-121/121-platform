import { HttpParams } from '@angular/common/http';
import { Injectable, Signal } from '@angular/core';

import { queryOptions } from '@tanstack/angular-query-experimental';
import { uniqueId } from 'lodash';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';

import { DomainApiService } from '~/domains/domain-api.service';
import { REGISTRATION_STATUS_LABELS } from '~/domains/registration/registration.helper';
import { ACTIVITY_LOG_ITEM_TYPE_LABELS } from '~/domains/registration/registration.helper';
import {
  ActivityLogItemType,
  ActivityLogItemWithOverview,
  DataChangeActivity,
  IntersolveVisaCardStatus,
  IntersolveVisaTokenStatus,
  MessageActivity,
  NoteActivity,
  Registration,
  StatusUpdateActivity,
  TransferActivity,
  VisaCard121Status,
  VisaCardAction,
  WalletWithCards,
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
    // XXX: the query shouldn't be defined here. This should be removed / refactored when the registrations page is built.
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
                transferNumber: 2,
                totalTransfers: 2,
                status: StatusEnum.waiting,
                amount: 100,
                sent: new Date(),
                received: new Date(),
                fsp: 'Intersolve',
                approvedBy: 'Samer@financial',
              },
            },
            {
              id: uniqueId(),
              author: 'finance@redcross.nl',
              date: new Date(new Date().getTime() - Math.random() * 1e12),
              activityType: ActivityLogItemType.Transfer,
              contents: {
                transferNumber: 1,
                totalTransfers: 2,
                status: StatusEnum.success,
                amount: 100,
                sent: new Date(),
                received: new Date(),
                fsp: 'Intersolve',
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
                    overview: $localize`${ACTIVITY_LOG_ITEM_TYPE_LABELS[item.activityType]}:activityType: ${item.contents.transferNumber}:count: of ${item.contents.totalTransfers}:totalCount:`,
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

  getWalletWithCardsByReferenceId(
    projectId: Signal<number>,
    referenceId: Signal<string | undefined>,
  ) {
    // TODO: AB#30525 - Use the real endpoint from intersolve visa branch
    // and use the 'generateQueryOptions' method instead of hardcoding the data here.
    //
    // return this.generateQueryOptions<WalletWithCards>({
    //   path: [
    //     ...BASE_ENDPOINT(projectId),
    //     referenceId,
    //     'financial-service-providers',
    //     'intersolve-visa',
    //     'wallet',
    //   ],
    //   enabled: () => !!referenceId(),
    // });

    return () => {
      const path = [
        ...BASE_ENDPOINT(projectId),
        referenceId,
        'financial-service-providers',
        'intersolve-visa',
        'wallet',
      ];
      return queryOptions({
        // eslint-disable-next-line @tanstack/query/exhaustive-deps
        queryKey: this.pathToQueryKey(path),
        queryFn: async () => {
          // fake a bit of a delay
          await new Promise((resolve) => setTimeout(resolve, 100));

          const data: WalletWithCards = {
            tokenCode: 'dfb237cf-c6e3-448d-ab7e-6df8e66fca0c',
            balance: 58,
            spentThisMonth: 12,
            maxToSpendPerMonth: 15000,
            lastUsedDate: '2024-09-27',
            lastExternalUpdate: '2024-09-27T14:20:37.346Z',
            cards: [
              {
                tokenCode: '3c11290f-0f1c-4334-a465-51a643009888',
                status: VisaCard121Status.Active,
                explanation: '',
                issuedDate: '2024-09-27T14:20:37.350Z',
                actions: [VisaCardAction.pause, VisaCardAction.reissue],
                debugInformation: {
                  intersolveVisaCardStatus: IntersolveVisaCardStatus.CardOk,
                  intersolveVisaTokenStatus: IntersolveVisaTokenStatus.Active,
                  isTokenBlocked: false,
                },
              },
            ],
          };

          return data;
        },
        enabled: () => !!referenceId(),
      });
    };
  }

  changeCardPauseStatus({
    projectId,
    referenceId,
    tokenCode,
    pauseStatus,
  }: {
    projectId: Signal<number>;
    referenceId: string;
    tokenCode: string;
    pauseStatus: boolean;
  }) {
    const endpoint = this.pathToQueryKey([
      ...BASE_ENDPOINT(projectId),
      referenceId,
      'financial-service-providers',
      'intersolve-visa',
      'wallet',
      'cards',
      tokenCode,
    ]).join('/');

    return this.httpWrapperService.perform121ServiceRequest({
      method: 'PATCH',
      endpoint,
      params: new HttpParams({
        fromObject: {
          pause: pauseStatus,
        },
      }),
    });
  }

  reissueCard({
    projectId,
    referenceId,
  }: {
    projectId: Signal<number>;
    referenceId: string;
  }) {
    const endpoint = this.pathToQueryKey([
      ...BASE_ENDPOINT(projectId),
      referenceId,
      'financial-service-providers',
      'intersolve-visa',
      'wallet',
      'cards',
    ]).join('/');

    return this.httpWrapperService.perform121ServiceRequest({
      method: 'POST',
      endpoint,
    });
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
