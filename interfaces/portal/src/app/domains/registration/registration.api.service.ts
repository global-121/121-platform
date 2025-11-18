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

const BASE_ENDPOINT = (programId: Signal<number | string>) => [
  'programs',
  programId,
  'registrations',
];

@Injectable({
  providedIn: 'root',
})
export class RegistrationApiService extends DomainApiService {
  getManyByQuery(
    programId: Signal<number | string>,
    paginateQuery: Signal<PaginateQuery | undefined>,
  ) {
    return this.generateQueryOptions<FindAllRegistrationsResult>({
      path: [...BASE_ENDPOINT(programId)],
      paginateQuery: paginateQuery as Signal<PaginateQuery>,
      enabled: () => !!paginateQuery(),
    });
  }

  getRegistrationById(
    programId: Signal<number | string | undefined>,
    registrationId: Signal<string | undefined>,
  ) {
    return this.generateQueryOptions<Registration>({
      path: [
        ...BASE_ENDPOINT(programId as Signal<number | string>),
        registrationId,
      ],
      enabled: () => !!programId() && !!registrationId(),
    });
  }

  getDuplicates({
    programId,
    referenceId,
  }: {
    programId: Signal<number | string>;
    referenceId: string;
  }) {
    return this.generateQueryOptions<DuplicatesResult[]>({
      path: [...BASE_ENDPOINT(programId), referenceId, 'duplicates'],
    });
  }

  ignoreDuplication({
    programId,
    registrationIds,
    reason,
  }: {
    programId: Signal<number | string>;
    registrationIds: number[];
    reason: string;
  }) {
    return this.httpWrapperService.perform121ServiceRequest({
      method: 'POST',
      endpoint: this.pathToQueryKey([
        ...BASE_ENDPOINT(programId),
        'uniques',
      ]).join('/'),
      body: {
        registrationIds,
        reason,
      },
    });
  }

  patchRegistration({
    programId,
    referenceId,
    data,
    reason,
  }: {
    programId: Signal<number | string>;
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
        ...BASE_ENDPOINT(programId),
        referenceId,
      ]).join('/'),
      body,
    });
  }

  getImportTemplate(programId: Signal<number | string>) {
    return this.generateQueryOptions<string[]>({
      path: [...BASE_ENDPOINT(programId), 'import', 'template'],
    });
  }

  importRegistrations({
    programId,
    file,
  }: {
    programId: Signal<number | string>;
    file: File;
  }) {
    const formData = new FormData();
    formData.append('file', file);

    return this.httpWrapperService.perform121ServiceRequest<Dto<ImportResult>>({
      method: 'POST',
      endpoint: this.pathToQueryKey([
        ...BASE_ENDPOINT(programId),
        'import',
      ]).join('/'),
      body: formData,
      isUpload: true,
    });
  }

  updateRegistrations({
    programId,
    file,
    reason,
  }: {
    programId: Signal<number | string>;
    file: File;
    reason: string;
  }) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('reason', reason);

    return this.httpWrapperService.perform121ServiceRequest<unknown>({
      method: 'PATCH',
      endpoint: this.pathToQueryKey([...BASE_ENDPOINT(programId)]).join('/'),
      body: formData,
      isUpload: true,
    });
  }

  sendMessage({
    programId,
    paginateQuery,
    messageData,
  }: {
    programId: Signal<number | string>;
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
        ...BASE_ENDPOINT(programId),
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
    programId,
    paginateQuery,
    status,
    reason,
    messageData,
    dryRun = true,
  }: {
    programId: Signal<number | string>;
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
        ? this.pathToQueryKey([...BASE_ENDPOINT(programId)]).join('/')
        : this.pathToQueryKey([...BASE_ENDPOINT(programId), 'status']).join(
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
    programId: Signal<number | string>,
    registrationId: Signal<number | string>,
  ) {
    return this.generateQueryOptions<ActitivitiesResponse>({
      path: [...BASE_ENDPOINT(programId), registrationId, 'activities'],
    });
  }

  getWalletWithCardsByReferenceId(
    programId: Signal<number | string>,
    referenceId: Signal<string | undefined>,
  ) {
    return this.generateQueryOptions<WalletWithCards>({
      path: [
        ...BASE_ENDPOINT(programId),
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
    programId,
    referenceId,
    tokenCode,
    pauseStatus,
  }: {
    programId: Signal<number | string>;
    referenceId: string;
    tokenCode: string;
    pauseStatus: boolean;
  }) {
    const endpoint = this.pathToQueryKey([
      ...BASE_ENDPOINT(programId),
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
    programId,
    referenceId,
  }: {
    programId: Signal<number | string>;
    referenceId: string;
  }) {
    const endpoint = this.pathToQueryKey([
      ...BASE_ENDPOINT(programId),
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
    programId,
  }: {
    programId: Signal<number | string>;
  }): Promise<void> {
    const path = [...BASE_ENDPOINT(programId)];

    return this.queryClient.invalidateQueries({
      queryKey: this.pathToQueryKey(path),
    });
  }

  public linkCardToRegistration({
    programId,
    referenceId,
    cardNumber,
  }: {
    programId: Signal<number | string>;
    referenceId: Signal<string>;
    cardNumber: Signal<string>;
  }) {
    return this.generateQueryOptions<Registration>({
      path: [
        ...BASE_ENDPOINT(programId),
        referenceId,
        'fsps',
        'intersolve-visa',
        'link-card',
      ],
      method: 'POST',
      enabled: () => !!referenceId(),
      params: { cardNumber },
    });
  }
}
