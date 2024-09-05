import { Injectable, Signal } from '@angular/core';
import { DomainApiService } from '~/domains/domain-api.service';
import { RegistrationActivityLogEntry } from '~/domains/registration/registration.model';
import { Transaction } from '~/domains/transaction/transaction.model';

const BASE_ENDPOINT = 'programs';

@Injectable({ providedIn: 'root' })
export class TransactionApiService extends DomainApiService {
  getRegistrationTransactions(
    projectId: Signal<number | undefined>,
    referenceId: string,
  ) {
    return this.generateQueryOptions<
      Transaction[],
      RegistrationActivityLogEntry[]
    >({
      path: [
        BASE_ENDPOINT,
        projectId,
        `transactions?referenceId=${referenceId}`,
      ],
      processResponse: (transactions) =>
        transactions.map((transaction) => ({
          activityType: 'transaction',
          doneBy: transaction.user.username ?? '',
          timestamp: new Date(transaction.created),
          overview: `Transfer ${transaction.payment.toString()}`,
        })),
    });
  }
}
