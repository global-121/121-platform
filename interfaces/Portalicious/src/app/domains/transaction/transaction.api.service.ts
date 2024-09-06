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
          //TODO: find a better way? id needed for expanding table row
          id: crypto.randomUUID(),
          activityType: 'transaction',
          doneBy: transaction.user.username ?? '',
          timestamp: new Date(transaction.created),
          overview: `Transfer ${transaction.payment.toString()}`,
          details: 'TODO: Implement event details',
        })),
    });
  }
}
