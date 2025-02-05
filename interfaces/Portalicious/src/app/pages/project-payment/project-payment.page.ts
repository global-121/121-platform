import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
  Signal,
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

import { AppRoutes } from '~/app.routes';
import { getChipDataByRegistrationStatus } from '~/components/colored-chip/colored-chip.helper';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import {
  QueryTableColumn,
  QueryTableColumnType,
  QueryTableComponent,
} from '~/components/query-table/query-table.component';
import { MetricApiService } from '~/domains/metric/metric.api.service';
import { PaymentMetricDetails } from '~/domains/metric/metric.model';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { PaymentAggregate } from '~/domains/payment/payment.model';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { projectHasFspWithExportFileIntegration } from '~/domains/project/project.helper';
import {
  REGISTRATION_STATUS_LABELS,
  registrationLink,
} from '~/domains/registration/registration.helper';
import {
  TRANSACTION_STATUS_CHIP_VARIANTS,
  TRANSACTION_STATUS_LABELS,
} from '~/domains/transaction/transaction.helper';
import { MetricTileComponent } from '~/pages/project-monitoring/components/metric-tile/metric-tile.component';
import { ImportReconciliationDataComponent } from '~/pages/project-payment/components/import-reconciliation-data/import-reconciliation-data.component';
import { ProjectPaymentChartComponent } from '~/pages/project-payment/components/project-payment-chart/project-payment-chart.component';
import { RetryTransfersDialogComponent } from '~/pages/project-payment/components/retry-transfers-dialog/retry-transfers-dialog.component';
import { SinglePaymentExportComponent } from '~/pages/project-payment/components/single-payment-export/single-payment-export.component';
import { AuthService } from '~/services/auth.service';
import { ToastService } from '~/services/toast.service';
import { TranslatableStringService } from '~/services/translatable-string.service';
import { getOriginUrl } from '~/utils/url-helper';

export interface TransactionsTableCellContext {
  projectId: Signal<string>;
}

@Component({
  selector: 'app-project-payment',
  imports: [
    PageLayoutComponent,
    CardModule,
    QueryTableComponent,
    DecimalPipe,
    ButtonModule,
    MetricTileComponent,
    ProjectPaymentChartComponent,
    SkeletonModule,
    RetryTransfersDialogComponent,
    SinglePaymentExportComponent,
    ImportReconciliationDataComponent,
  ],
  templateUrl: './project-payment.page.html',
  styles: ``,
  providers: [CurrencyPipe, DatePipe, DecimalPipe, ToastService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPaymentPageComponent {
  // this is injected by the router
  readonly projectId = input.required<string>();
  readonly paymentId = input.required<string>();

  private authService = inject(AuthService);
  private currencyPipe = inject(CurrencyPipe);
  private locale = inject(LOCALE_ID);
  private paymentApiService = inject(PaymentApiService);
  private projectApiService = inject(ProjectApiService);
  private metricApiService = inject(MetricApiService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private translatableStringService = inject(TranslatableStringService);

  readonly table =
    viewChild.required<QueryTableComponent<PaymentMetricDetails, never>>(
      'table',
    );
  readonly retryTransfersDialog =
    viewChild.required<RetryTransfersDialogComponent>('retryTransfersDialog');

  readonly contextMenuSelection = signal<PaymentMetricDetails | undefined>(
    undefined,
  );

  project = injectQuery(this.projectApiService.getProject(this.projectId));
  paymentStatus = injectQuery(
    this.paymentApiService.getPaymentStatus(this.projectId),
  );
  payment = injectQuery(() => ({
    ...this.paymentApiService.getPayment(this.projectId, this.paymentId)(),
    // Refetch the data every second if a payment count !== transactions count
    refetchInterval: this.refetchPayment() ? 1000 : undefined,
    success: (data: PaymentAggregate) => {
      if (
        data.success.count + data.failed.count + data.waiting.count ===
        this.transactions.data()?.length
      ) {
        this.refetchPayment.set(false);
      }
    },
  }));
  payments = injectQuery(this.paymentApiService.getPayments(this.projectId));
  transactions = injectQuery(
    this.metricApiService.getPaymentData({
      projectId: this.projectId,
      payment: this.paymentId,
    }),
  );

  readonly refetchPayment = signal(true);

  readonly allPaymentsLink = computed(() => [
    '/',
    AppRoutes.project,
    this.projectId(),
    AppRoutes.projectPayments,
  ]);

  readonly paymentDate = computed(() => {
    if (!this.payments.isSuccess()) {
      return '';
    }

    const date = this.payments
      .data()
      .find(
        (payment) => payment.payment === Number(this.paymentId()),
      )?.paymentDate;

    return new DatePipe(this.locale).transform(date, 'short') ?? '';
  });

  readonly paymentTitle = computed(
    () => $localize`Payment` + ' ' + this.paymentDate(),
  );

  readonly totalPaymentAmount = computed(() => {
    if (!this.payment.isSuccess()) {
      return '-';
    }

    const totalAmount =
      this.payment.data().failed.amount +
      this.payment.data().success.amount +
      this.payment.data().waiting.amount;

    return (
      this.currencyPipe.transform(
        totalAmount,
        this.project.data()?.currency ?? 'EUR',
        'symbol-narrow',
        '1.0-0',
      ) ?? '0'
    );
  });

  readonly successfulPaymentsAmount = computed(() => {
    if (!this.payment.isSuccess()) {
      return '-';
    }

    return (
      this.currencyPipe.transform(
        this.payment.data().success.amount,
        this.project.data()?.currency ?? 'EUR',
        'symbol-narrow',
        '1.0-0',
      ) ?? '0'
    );
  });

  readonly columns = computed(() => {
    if (!this.project.isSuccess()) {
      return [];
    }
    const projectPaymentColumns: QueryTableColumn<PaymentMetricDetails>[] = [
      {
        field: 'id',
        header: $localize`Reg. #`,
        getCellText: (transaction) => `Reg. #${transaction.id.toString()}`,
        getCellRouterLink: (transaction) =>
          registrationLink({
            projectId: this.projectId(),
            registrationId: transaction.registrationId,
          }),
      },
      {
        field: 'fullName',
        header: $localize`Name`,
        getCellRouterLink: (transaction) =>
          registrationLink({
            projectId: this.projectId(),
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
        getCellChipData: (transaction) =>
          getChipDataByRegistrationStatus(transaction.registrationStatus),
      },
      {
        field: 'status',
        header: $localize`Transfer status`,
        type: QueryTableColumnType.MULTISELECT,
        options: Object.values(TransactionStatusEnum).map((status) => ({
          label: TRANSACTION_STATUS_LABELS[status],
          value: status,
        })),
        getCellChipData: (transaction) => ({
          chipLabel: TRANSACTION_STATUS_LABELS[transaction.status],
          chipVariant: TRANSACTION_STATUS_CHIP_VARIANTS[transaction.status],
        }),
      },
      {
        field: 'errorMessage',
        header: $localize`Fail reason`,
      },
      {
        field: 'amount',
        header: $localize`Transfer value`,
        getCellText: (transaction) =>
          this.currencyPipe.transform(
            transaction.amount,
            this.project.data()?.currency ?? 'EUR',
            'symbol-narrow',
            '1.0-0',
          ) ?? '',
      },
      {
        field: 'financialserviceprovider',
        header: $localize`FSP`,
        type: QueryTableColumnType.MULTISELECT,
        options: this.project
          .data()
          .programFinancialServiceProviderConfigurations.map((config) => ({
            label: this.translatableStringService.translate(config.label) ?? '',
            value: config.name,
          })),
      },
      {
        field: 'timestamp',
        header: $localize`Time and date`,
        type: QueryTableColumnType.DATE,
      },
    ];

    return projectPaymentColumns;
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
                projectId: this.projectId(),
                registrationId: transaction.registrationId,
              }),
            ),
          );
          window.open(getOriginUrl() + url, '_blank');
        },
      },
      {
        label: $localize`Retry failed transfers`,
        icon: 'pi pi-refresh',
        command: () => {
          this.retryFailedTransfers({ triggeredFromContextMenu: true });
        },
        visible:
          this.canRetryTransfers() &&
          transaction.status === TransactionStatusEnum.error,
      },
    ];
  });

  readonly localStorageKey = computed(
    () =>
      `project-payment-table-${this.projectId().toString()}-${this.paymentId().toString()}`,
  );

  readonly canRetryTransfers = computed(() => {
    if (
      !this.authService.hasAllPermissions({
        projectId: this.projectId(),
        requiredPermissions: [
          PermissionEnum.PaymentREAD,
          PermissionEnum.PaymentCREATE,
          PermissionEnum.PaymentTransactionREAD,
        ],
      })
    ) {
      return false;
    }

    if (!this.transactions.isSuccess()) {
      return false;
    }

    return this.transactions
      .data()
      .some((payment) => payment.status === TransactionStatusEnum.error);
  });

  readonly hasFspWithExportFileIntegration = computed(() =>
    projectHasFspWithExportFileIntegration(this.project.data()),
  );
  retryFailedTransfers({
    triggeredFromContextMenu = false,
  }: {
    triggeredFromContextMenu?: boolean;
  } = {}) {
    if (this.paymentStatus.data()?.inProgress) {
      this.toastService.showToast({
        severity: 'warn',
        detail: $localize`A payment is currently in progress. Please wait until it has finished.`,
      });
      return;
    }
    const actionData = this.table().getActionData({
      triggeredFromContextMenu,
      contextMenuItem: this.contextMenuSelection(),
      fieldForFilter: 'referenceId',
      noSelectionToastMessage: $localize`:@@no-registrations-selected:Select one or more registrations and try again.`,
    });

    if (!actionData) {
      return;
    }

    const selection = actionData.selection;

    if (!Array.isArray(selection) || selection.length === 0) {
      this.toastService.showGenericError(); // Should never happen
      return;
    }

    const referenceIds = selection.map(
      (transaction) => transaction.referenceId,
    );

    this.retryTransfersDialog().retryFailedTransfers({
      referenceIds,
    });
  }
}
