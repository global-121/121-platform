import { Injectable, Signal } from '@angular/core';

import { DomainApiService } from '~/domains/domain-api.service';
import { WalletWithCards } from '~/domains/fsp-account-management/intersolve-visa.model';

const BASE_ENDPOINT = (programId: Signal<number | string>) => [
  'programs',
  programId,
  'registrations',
];

@Injectable({
  providedIn: 'root',
})
export class IntersolveVisaApiService extends DomainApiService {
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

  replaceCardByMail({
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
      'by-mail',
      'replace',
    ]).join('/');

    return this.httpWrapperService.perform121ServiceRequest({
      method: 'POST',
      endpoint,
    });
  }

  public linkCardToRegistration({
    programId,
    referenceId,
    tokenCode,
  }: {
    programId: Signal<number | string>;
    referenceId: Signal<string | undefined>;
    tokenCode: string;
  }) {
    const endpoint = this.pathToQueryKey([
      ...BASE_ENDPOINT(programId),
      referenceId,
      'fsps',
      'intersolve-visa',
      'wallet',
      'cards',
      'on-site',
      'link',
    ]).join('/');

    const body = { tokenCode };

    return this.httpWrapperService.perform121ServiceRequest({
      method: 'POST',
      endpoint,
      body,
    });
  }

  public replaceCardOnSite({
    programId,
    referenceId,
    tokenCode,
  }: {
    programId: Signal<number | string>;
    referenceId: Signal<string | undefined>;
    tokenCode: string;
  }) {
    const endpoint = this.pathToQueryKey([
      ...BASE_ENDPOINT(programId),
      referenceId,
      'fsps',
      'intersolve-visa',
      'wallet',
      'cards',
      'on-site',
      'replace',
    ]).join('/');

    const body = { tokenCode };

    const req = this.httpWrapperService.perform121ServiceRequest({
      method: 'POST',
      endpoint,
      body,
    });

    return req;
  }
}
