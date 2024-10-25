import { HttpParams } from '@angular/common/http';
import { inject, Injectable, Signal } from '@angular/core';

import { queryOptions } from '@tanstack/angular-query-experimental';

import { SendCustomTextDto } from '@121-service/src/registration/dto/send-custom-text.dto';

import { DomainApiService } from '~/domains/domain-api.service';
import {
  ActitivitiesResponse,
  FindAllRegistrationsResult,
  IntersolveVisaCardStatus,
  IntersolveVisaTokenStatus,
  Registration,
  SendMessageData,
  VisaCard121Status,
  VisaCardAction,
  WalletWithCards,
} from '~/domains/registration/registration.model';
import {
  PaginateQuery,
  PaginateQueryService,
} from '~/services/paginate-query.service';

const BASE_ENDPOINT = (projectId: Signal<number>) => [
  'programs',
  projectId,
  'registrations',
];

@Injectable({
  providedIn: 'root',
})
export class RegistrationApiService extends DomainApiService {
  paginateQueryService = inject(PaginateQueryService);

  getManyByQuery(
    projectId: Signal<number>,
    paginateQuery: Signal<PaginateQuery | undefined>,
  ) {
    return () => {
      const path = [...BASE_ENDPOINT(projectId)];

      return queryOptions({
        queryKey: [path, paginateQuery()],
        queryFn: async () =>
          this.httpWrapperService.perform121ServiceRequest<FindAllRegistrationsResult>(
            {
              method: 'GET',
              endpoint: this.pathToQueryKey(path).join('/'),
              params:
                this.paginateQueryService.paginateQueryToHttpParams(
                  paginateQuery(),
                ),
            },
          ),
        enabled: () => !!paginateQuery(),
      });
    };
  }

  getRegistrationById(
    projectId: Signal<number | undefined>,
    registrationId: Signal<number | undefined>,
  ) {
    return this.generateQueryOptions<Registration>({
      path: [...BASE_ENDPOINT(projectId as Signal<number>), registrationId],
      enabled: () => !!projectId() && !!registrationId(),
    });
  }

  sendMessage({
    projectId,
    paginateQuery,
    messageData,
  }: {
    projectId: Signal<number>;
    paginateQuery: PaginateQuery | undefined;
    messageData: SendMessageData;
  }) {
    let body: Partial<SendCustomTextDto>;

    if ('customMessage' in messageData) {
      body = {
        message: messageData.customMessage,
        skipMessageValidation: false,
      };
    } else {
      body = {
        messageTemplateKey: messageData.messageTemplateKey,
        skipMessageValidation: false,
      };
    }

    return this.httpWrapperService.perform121ServiceRequest({
      method: 'POST',
      endpoint: this.pathToQueryKey([
        ...BASE_ENDPOINT(projectId),
        'message',
      ]).join('/'),
      body,
      params:
        this.paginateQueryService.paginateQueryToHttpParams(paginateQuery),
    });
  }

  getActivityLog(projectId: Signal<number>, registrationId: Signal<number>) {
    return this.generateQueryOptions<ActitivitiesResponse>({
      path: [...BASE_ENDPOINT(projectId), registrationId, 'activities'],
    });
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
            tokenCode: 'c7283364-55fd-4f6d-8496-e6b28fccbb95',
            balance: 2500,
            spentThisMonth: 300,
            maxToSpendPerMonth: 15000,
            lastUsedDate: '2024-10-01',
            lastExternalUpdate: '2024-10-01T09:30:44.868Z',
            cards: [
              {
                tokenCode: 'mock-token-5f3df5b7-77dc-4f7a-a2a9-2160b71e2e1c',
                status: VisaCard121Status.Active,
                explanation: '',
                issuedDate: '2024-10-01T09:30:06.449Z',
                actions: [VisaCardAction.pause, VisaCardAction.reissue],
                debugInformation: {
                  intersolveVisaCardStatus: IntersolveVisaCardStatus.CardOk,
                  intersolveVisaTokenStatus: IntersolveVisaTokenStatus.Active,
                  isTokenBlocked: false,
                },
              },
              {
                tokenCode: 'mock-token-0326e461-8861-48b4-8986-4712a7fa7ffb',
                status: VisaCard121Status.Substituted,
                explanation: 'Card has been substituted due to re-issue',
                issuedDate: '2024-10-01T09:29:48.734Z',
                actions: [],
                debugInformation: {
                  intersolveVisaCardStatus: IntersolveVisaCardStatus.CardOk,
                  intersolveVisaTokenStatus:
                    IntersolveVisaTokenStatus.Substituted,
                  isTokenBlocked: false,
                },
              },
              {
                tokenCode: '3c45a5bb-99a6-4f5a-b9b2-07fce4572162',
                status: VisaCard121Status.Substituted,
                explanation: 'Card has been substituted due to re-issue',
                issuedDate: '2024-10-01T09:28:40.313Z',
                actions: [],
                debugInformation: {
                  intersolveVisaCardStatus: IntersolveVisaCardStatus.CardOk,
                  intersolveVisaTokenStatus:
                    IntersolveVisaTokenStatus.Substituted,
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
