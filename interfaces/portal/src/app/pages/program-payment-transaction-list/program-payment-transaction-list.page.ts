import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import {
  getChipDataByRegistrationStatus,
  getChipDataByTransactionStatus,
} from '~/components/colored-chip/colored-chip.helper';
import { PageLayoutPaymentComponent } from '~/components/page-layout-payment/page-layout-payment.component';
import {
  QueryTableColumn,
  QueryTableColumnType,
  QueryTableComponent,
} from '~/components/query-table/query-table.component';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { ProgramApiService } from '~/domains/program/program.api.service';
import {
  REGISTRATION_STATUS_LABELS,
  registrationLink,
} from '~/domains/registration/registration.helper';
import { TRANSACTION_STATUS_LABELS } from '~/domains/transaction/transaction.helper';
import { Transaction } from '~/domains/transaction/transaction.model';
import { RetryTransactionsDialogComponent } from '~/pages/program-payment-transaction-list/components/retry-transactions-dialog/retry-transactions-dialog.component';
import { AuthService } from '~/services/auth.service';
import {
  FilterOperator,
  PaginateQuery,
} from '~/services/paginate-query.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';
import { TranslatableStringService } from '~/services/translatable-string.service';
import { getOriginUrl } from '~/utils/url-helper';

@Component({
  selector: 'app-program-payment-transaction-list',
  imports: [
    PageLayoutPaymentComponent,
    CardModule,
    QueryTableComponent,
    ButtonModule,
    SkeletonModule,
    RetryTransactionsDialogComponent,
  ],
  templateUrl: './program-payment-transaction-list.page.html',
  styles: ``,
  providers: [CurrencyPipe, DatePipe, DecimalPipe, ToastService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramPaymentTransactionListPageComponent {
  // this is injected by the router
  readonly programId = input.required<string>();
  readonly paymentId = input.required<string>();

  readonly authService = inject(AuthService);
  readonly currencyPipe = inject(CurrencyPipe);
  readonly paymentApiService = inject(PaymentApiService);
  readonly programApiService = inject(ProgramApiService);
  readonly rtlHelper = inject(RtlHelperService);
  readonly router = inject(Router);
  readonly toastService = inject(ToastService);
  readonly translatableStringService = inject(TranslatableStringService);

  readonly table =
    viewChild.required<QueryTableComponent<Transaction, never>>('table');
  readonly retryTransactionsDialog =
    viewChild.required<RetryTransactionsDialogComponent>(
      'retryTransactionsDialog',
    );

  readonly contextMenuSelection = signal<Transaction | undefined>(undefined);

  protected readonly paginateQuery = signal<PaginateQuery | undefined>(
    undefined,
  );

  private readonly transactionsPaginateQuery = computed<PaginateQuery>(() => {
    const paginateQuery = this.paginateQuery() ?? {};
    return {
      ...paginateQuery,
      ...(paginateQuery.filter ?? {}),
    };
  });

  program = injectQuery(this.programApiService.getProgram(this.programId));

  transactionsResponse = injectQuery(
    this.paymentApiService.getPaymentTransactions({
      programId: this.programId,
      paymentId: this.paymentId,
      paginateQuery: this.transactionsPaginateQuery,
    }),
  );

  readonly transactions = computed(
    () => this.transactionsResponse.data()?.data ?? [],
  );
  protected readonly totalTransactions = computed(
    () => this.transactionsResponse.data()?.meta.totalItems ?? 0,
  );

  readonly refetchPayment = signal(true);

  readonly columns = computed(() => {
    if (!this.program.isSuccess()) {
      return [];
    }
    const programPaymentColumns: QueryTableColumn<Transaction>[] = [
      {
        field: 'registrationProgramId',
        header: $localize`Reg. #`,
        type: QueryTableColumnType.NUMERIC,
        getCellText: (transaction) => {
          const registrationId = transaction.registrationProgramId ?? '';
          return $localize`Reg. #${registrationId}`;
        },
        getCellRouterLink: (transaction) =>
          registrationLink({
            programId: this.programId(),
            registrationId: transaction.registrationId,
          }),
      },
      {
        field: 'registrationStatus',
        header: $localize`Registration Status`,
        type: QueryTableColumnType.MULTISELECT,
        options: Object.values(RegistrationStatusEnum).map((status) => ({
          label: REGISTRATION_STATUS_LABELS[status],
          value: status,
        })),
        displayAsChip: true,
        getCellChipData: (transaction) =>
          getChipDataByRegistrationStatus(transaction.registrationStatus),
      },
      {
        field: 'status',
        header: $localize`Transaction status`,
        type: QueryTableColumnType.MULTISELECT,
        options: Object.values(TransactionStatusEnum).map((status) => ({
          label: TRANSACTION_STATUS_LABELS[status],
          value: status,
        })),
        displayAsChip: true,
        getCellChipData: (transaction) =>
          getChipDataByTransactionStatus(transaction.status),
      },
      {
        field: 'errorMessage',
        header: $localize`Reason`,
      },
      {
        field: 'transferValue',
        header: $localize`Transfer value`,
        type: QueryTableColumnType.NUMERIC,
        getCellText: (transaction) =>
          this.currencyPipe.transform(
            transaction.transferValue,
            this.program.data()?.currency,
            'symbol-narrow',
            '1.2-2',
          ) ?? '',
      },
      {
        field: 'programFspConfigurationName',
        header: $localize`FSP`,
        type: QueryTableColumnType.MULTISELECT,
        options: this.program.data().programFspConfigurations.map((config) => ({
          label: this.translatableStringService.translate(config.label) ?? '',
          value: config.name,
        })),
        displayAsChip: true,
      },
      {
        field: 'created',
        header: $localize`Created`,
        type: QueryTableColumnType.DATE,
      },
      {
        field: 'updated',
        header: $localize`Updated`,
        type: QueryTableColumnType.DATE,
      },
    ];

    if (this.program.data().enableScope) {
      programPaymentColumns.splice(3, 0, {
        field: 'registrationScope',
        header: $localize`Registration Scope`,
      });
    }

    return programPaymentColumns;
  });

  readonly contextMenuItems = computed<MenuItem[]>(() => {
    const transaction = this.contextMenuSelection();

    if (!transaction) {
      return [];
    }

    return [
      {
        label: $localize`Open in new tab`,
        icon: 'pi pi-user',
        command: () => {
          const url = this.router.serializeUrl(
            this.router.createUrlTree(
              registrationLink({
                programId: this.programId(),
                registrationId: transaction.registrationId,
              }),
            ),
          );
          window.open(getOriginUrl() + url, '_blank');
        },
      },
      {
        label: $localize`Retry failed transaction`,
        icon: 'pi pi-refresh',
        command: () => {
          this.retryFailedTransactions({ triggeredFromContextMenu: true });
        },
        visible:
          this.canRetryTransactions() &&
          transaction.status === TransactionStatusEnum.error,
      },
    ];
  });

  readonly localStorageKey = computed(
    () => `program-payment-table-${this.programId()}-${this.paymentId()}`,
  );

  private readonly failedTransactionsPaginateQuery = signal<PaginateQuery>({
    filter: {
      status: `${FilterOperator.EQ}:${TransactionStatusEnum.error}`,
    },
  });

  private failedTransactionsResponse = injectQuery(
    this.paymentApiService.getPaymentTransactions({
      programId: this.programId,
      paymentId: this.paymentId,
      paginateQuery: this.failedTransactionsPaginateQuery,
    }),
  );

  readonly hasFailedTransactions = computed(() => {
    if (!this.failedTransactionsResponse.isSuccess()) {
      return false;
    }

    const metaData = this.failedTransactionsResponse.data().meta;

    if (!metaData.totalItems) {
      return false;
    }

    return metaData.totalItems > 0;
  });

  readonly canRetryTransactions = computed(() => {
    if (
      !this.authService.hasAllPermissions({
        programId: this.programId(),
        requiredPermissions: [
          PermissionEnum.PaymentREAD,
          PermissionEnum.PaymentUPDATE,
          PermissionEnum.PaymentTransactionREAD,
        ],
      })
    ) {
      return false;
    }

    if (!this.transactionsResponse.isSuccess()) {
      return false;
    }

    return this.hasFailedTransactions();
  });

  retryFailedTransactions({
    triggeredFromContextMenu = false,
  }: {
    triggeredFromContextMenu?: boolean;
  } = {}) {
    const actionData = this.table().getActionData({
      triggeredFromContextMenu,
      contextMenuItem: this.contextMenuSelection(),
      fieldForFilter: 'registrationReferenceId',
      noSelectionToastMessage: $localize`:@@no-registrations-selected:Select one or more registrations and try again.`,
    });

    if (!actionData) {
      return;
    }

    const selection = actionData.selection;

    let referenceIds: string[] | undefined = undefined;

    if (Array.isArray(selection)) {
      referenceIds = selection.map(
        (transaction) => transaction.registrationReferenceId ?? '',
      );
    }

    this.retryTransactionsDialog().retryFailedTransactions({
      transactionCount: actionData.count,
      referenceIds,
    });
  }
}
