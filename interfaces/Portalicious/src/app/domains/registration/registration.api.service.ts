import { Injectable, Signal } from '@angular/core';

import { ImportResult } from '@121-service/src/registration/dto/bulk-import.dto';
import { RegistrationStatusPatchDto } from '@121-service/src/registration/dto/registration-status-patch.dto';
import { SendCustomTextDto } from '@121-service/src/registration/dto/send-custom-text.dto';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

import { DomainApiService } from '~/domains/domain-api.service';
import {
  ActitivitiesResponse,
  ChangeStatusResult,
  FindAllRegistrationsResult,
  Registration,
  SendMessageData,
  WalletWithCards,
} from '~/domains/registration/registration.model';
import { PaginateQuery } from '~/services/paginate-query.service';
import { Dto } from '~/utils/dto-type';

const BASE_ENDPOINT = (projectId: Signal<number>) => [
  'programs',
  projectId,
  'registrations',
];

@Injectable({
  providedIn: 'root',
})
export class RegistrationApiService extends DomainApiService {
  getManyByQuery(
    projectId: Signal<number>,
    paginateQuery: Signal<PaginateQuery | undefined>,
  ) {
    return this.generateQueryOptions<FindAllRegistrationsResult>({
      path: [...BASE_ENDPOINT(projectId)],
      paginateQuery: paginateQuery as Signal<PaginateQuery>,
      enabled: () => !!paginateQuery(),
    });
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

  getImportTemplate(projectId: Signal<number>) {
    return this.generateQueryOptions<string[]>({
      path: [...BASE_ENDPOINT(projectId), 'import-template'],
    });
  }

  importRegistrations({
    projectId,
    file,
  }: {
    projectId: Signal<number>;
    file: File;
  }) {
    const formData = new FormData();
    formData.append('file', file);

    return this.httpWrapperService.perform121ServiceRequest<Dto<ImportResult>>({
      method: 'POST',
      endpoint: this.pathToQueryKey([
        ...BASE_ENDPOINT(projectId),
        'import-registrations',
      ]).join('/'),
      body: formData,
      isUpload: true,
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
        this.paginateQueryService.paginateQueryToHttpParamsObject(
          paginateQuery,
        ),
    });
  }

  changeStatus({
    projectId,
    paginateQuery,
    status,
    messageData,
    dryRun = true,
  }: {
    projectId: Signal<number>;
    paginateQuery: PaginateQuery | undefined;
    status: RegistrationStatusEnum;
    messageData?: SendMessageData | undefined;
    dryRun: boolean;
  }) {
    let body: RegistrationStatusPatchDto = {
      status,
    };
    if (messageData && 'customMessage' in messageData) {
      body = {
        ...body,
        message: messageData.customMessage,
      };
    } else if (messageData) {
      body = {
        ...body,
        messageTemplateKey: messageData.messageTemplateKey,
      };
    }

    let params =
      this.paginateQueryService.paginateQueryToHttpParamsObject(paginateQuery);
    params = {
      ...params,
      dryRun,
    };

    const method =
      status === RegistrationStatusEnum.deleted ? 'DELETE' : 'PATCH';
    const endpoint =
      status === RegistrationStatusEnum.deleted
        ? this.pathToQueryKey([...BASE_ENDPOINT(projectId)]).join('/')
        : this.pathToQueryKey([...BASE_ENDPOINT(projectId), 'status']).join(
            '/',
          );

    return this.httpWrapperService.perform121ServiceRequest<ChangeStatusResult>(
      {
        method,
        endpoint,
        body,
        params,
      },
    );
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
    return this.generateQueryOptions<WalletWithCards>({
      path: [
        ...BASE_ENDPOINT(projectId),
        referenceId,
        'financial-service-providers',
        'intersolve-visa',
        'wallet',
      ],
      enabled: () => !!referenceId(),
    });
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
      params: {
        pause: pauseStatus,
      },
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
