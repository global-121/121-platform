import { Injectable, Signal } from '@angular/core';

import { ImportResult } from '@121-service/src/registration/dto/bulk-import.dto';
import { RegistrationStatusPatchDto } from '@121-service/src/registration/dto/registration-status-patch.dto';
import { SendCustomTextDto } from '@121-service/src/registration/dto/send-custom-text.dto';
import { UpdateRegistrationDto } from '@121-service/src/registration/dto/update-registration.dto';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

import { DomainApiService } from '~/domains/domain-api.service';
import {
  ActitivitiesResponse,
  ChangeStatusResult,
  DuplicatesResult,
  FindAllRegistrationsResult,
  Registration,
  SendMessageData,
  WalletWithCards,
} from '~/domains/registration/registration.model';
import { PaginateQuery } from '~/services/paginate-query.service';
import { Dto } from '~/utils/dto-type';

const BASE_ENDPOINT = (projectId: Signal<number | string>) => [
  'projects',
  projectId,
  'registrations',
];

@Injectable({
  providedIn: 'root',
})
export class RegistrationApiService extends DomainApiService {
  getManyByQuery(
    projectId: Signal<number | string>,
    paginateQuery: Signal<PaginateQuery | undefined>,
  ) {
    return this.generateQueryOptions<FindAllRegistrationsResult>({
      path: [...BASE_ENDPOINT(projectId)],
      paginateQuery: paginateQuery as Signal<PaginateQuery>,
      enabled: () => !!paginateQuery(),
    });
  }

  getRegistrationById(
    projectId: Signal<number | string | undefined>,
    registrationId: Signal<string | undefined>,
  ) {
    return this.generateQueryOptions<Registration>({
      path: [
        ...BASE_ENDPOINT(projectId as Signal<number | string>),
        registrationId,
      ],
      enabled: () => !!projectId() && !!registrationId(),
    });
  }

  getDuplicates({
    projectId,
    referenceId,
  }: {
    projectId: Signal<number | string>;
    referenceId: string;
  }) {
    return this.generateQueryOptions<DuplicatesResult[]>({
      path: [...BASE_ENDPOINT(projectId), referenceId, 'duplicates'],
    });
  }

  ignoreDuplication({
    projectId,
    registrationIds,
    reason,
  }: {
    projectId: Signal<number | string>;
    registrationIds: number[];
    reason: string;
  }) {
    return this.httpWrapperService.perform121ServiceRequest({
      method: 'POST',
      endpoint: this.pathToQueryKey([
        ...BASE_ENDPOINT(projectId),
        'uniques',
      ]).join('/'),
      body: {
        registrationIds,
        reason,
      },
    });
  }

  patchRegistration({
    projectId,
    referenceId,
    data,
    reason,
  }: {
    projectId: Signal<number | string>;
    referenceId: string;
    data: UpdateRegistrationDto['data'];
    reason: string;
  }) {
    const body: UpdateRegistrationDto = {
      data,
      reason,
    };

    return this.httpWrapperService.perform121ServiceRequest<Registration>({
      method: 'PATCH',
      endpoint: this.pathToQueryKey([
        ...BASE_ENDPOINT(projectId),
        referenceId,
      ]).join('/'),
      body,
    });
  }

  getImportTemplate(projectId: Signal<number | string>) {
    return this.generateQueryOptions<string[]>({
      path: [...BASE_ENDPOINT(projectId), 'import', 'template'],
    });
  }

  importRegistrations({
    projectId,
    file,
  }: {
    projectId: Signal<number | string>;
    file: File;
  }) {
    const formData = new FormData();
    formData.append('file', file);

    return this.httpWrapperService.perform121ServiceRequest<Dto<ImportResult>>({
      method: 'POST',
      endpoint: this.pathToQueryKey([
        ...BASE_ENDPOINT(projectId),
        'import',
      ]).join('/'),
      body: formData,
      isUpload: true,
    });
  }

  updateRegistrations({
    projectId,
    file,
    reason,
  }: {
    projectId: Signal<number | string>;
    file: File;
    reason: string;
  }) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('reason', reason);

    return this.httpWrapperService.perform121ServiceRequest<unknown>({
      method: 'PATCH',
      endpoint: this.pathToQueryKey([...BASE_ENDPOINT(projectId)]).join('/'),
      body: formData,
      isUpload: true,
    });
  }

  sendMessage({
    projectId,
    paginateQuery,
    messageData,
  }: {
    projectId: Signal<number | string>;
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
      httpParams:
        this.paginateQueryService.paginateQueryToHttpParamsObject(
          paginateQuery,
        ),
    });
  }

  changeStatus({
    projectId,
    paginateQuery,
    status,
    reason,
    messageData,
    dryRun = true,
  }: {
    projectId: Signal<number | string>;
    paginateQuery: PaginateQuery | undefined;
    status: RegistrationStatusEnum;
    reason?: string | undefined;
    messageData?: SendMessageData | undefined;
    dryRun: boolean;
  }) {
    let body: Dto<RegistrationStatusPatchDto> = {
      status,
      reason,
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
        httpParams: params,
      },
    );
  }

  getActivityLog(
    projectId: Signal<number | string>,
    registrationId: Signal<number | string>,
  ) {
    return this.generateQueryOptions<ActitivitiesResponse>({
      path: [...BASE_ENDPOINT(projectId), registrationId, 'activities'],
    });
  }

  getWalletWithCardsByReferenceId(
    projectId: Signal<number | string>,
    referenceId: Signal<string | undefined>,
  ) {
    return this.generateQueryOptions<WalletWithCards>({
      path: [
        ...BASE_ENDPOINT(projectId),
        referenceId,
        'fsps',
        'intersolve-visa',
        'wallet',
      ],
      method: 'PATCH',
      enabled: () => !!referenceId(),
    });
  }

  changeCardPauseStatus({
    projectId,
    referenceId,
    tokenCode,
    pauseStatus,
  }: {
    projectId: Signal<number | string>;
    referenceId: string;
    tokenCode: string;
    pauseStatus: boolean;
  }) {
    const endpoint = this.pathToQueryKey([
      ...BASE_ENDPOINT(projectId),
      referenceId,
      'fsps',
      'intersolve-visa',
      'wallet',
      'cards',
      tokenCode,
    ]).join('/');

    return this.httpWrapperService.perform121ServiceRequest({
      method: 'PATCH',
      endpoint,
      httpParams: {
        pause: pauseStatus,
      },
    });
  }

  reissueCard({
    projectId,
    referenceId,
  }: {
    projectId: Signal<number | string>;
    referenceId: string;
  }) {
    const endpoint = this.pathToQueryKey([
      ...BASE_ENDPOINT(projectId),
      referenceId,
      'fsps',
      'intersolve-visa',
      'wallet',
      'cards',
    ]).join('/');

    return this.httpWrapperService.perform121ServiceRequest({
      method: 'POST',
      endpoint,
    });
  }

  getRegistrationsByPhonenumber({
    phonenumber,
  }: {
    phonenumber: Signal<string>;
  }) {
    return this.generateQueryOptions<Registration[]>({
      path: ['registrations'],
      params: {
        phonenumber,
      },
    });
  }

  public async invalidateCache({
    projectId,
  }: {
    projectId: Signal<number | string>;
  }): Promise<void> {
    const path = [...BASE_ENDPOINT(projectId)];

    return this.queryClient.invalidateQueries({
      queryKey: this.pathToQueryKey(path),
    });
  }
}
