import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
  Signal,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { AppRoutes } from '~/app.routes';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import {
  QueryTableColumn,
  QueryTableColumnType,
  QueryTableComponent,
} from '~/components/query-table/query-table.component';
import { MetricApiService } from '~/domains/metric/metric.api.service';
import { PaymentMetricDetails } from '~/domains/metric/metric.model';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { registrationLink } from '~/domains/registration/registration.helper';
import {
  TRANSACTION_STATUS_CHIP_VARIANTS,
  TRANSACTION_STATUS_LABELS,
} from '~/domains/transaction/transaction.helper';
import { MetricTileComponent } from '~/pages/project-monitoring/components/metric-tile/metric-tile.component';
import { ExportPaymentInstructionsComponent } from '~/pages/project-payment/components/export-payment-instructions/export-payment-instructions.component';
import { ProjectPaymentChartComponent } from '~/pages/project-payment/components/project-payment-chart/project-payment-chart.component';
import { AuthService } from '~/services/auth.service';
import { ToastService } from '~/services/toast.service';
import { TranslatableStringService } from '~/services/translatable-string.service';

export interface TransactionsTableCellContext {
  projectId: Signal<number>;
}

@Component({
  selector: 'app-project-payment',
  standalone: true,
  imports: [
    PageLayoutComponent,
    CardModule,
    QueryTableComponent,
    ButtonModule,
    MetricTileComponent,
    ProjectPaymentChartComponent,
    SkeletonModule,
    ExportPaymentInstructionsComponent,
  ],
  templateUrl: './project-payment.page.html',
  styles: ``,
  providers: [CurrencyPipe, DatePipe, ToastService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPaymentPageComponent {
  readonly projectId = input.required<number>();
  readonly paymentId = input.required<number>();

  private authService = inject(AuthService);
  private currencyPipe = inject(CurrencyPipe);
  private locale = inject(LOCALE_ID);
  private paymentApiService = inject(PaymentApiService);
  private projectApiService = inject(ProjectApiService);
  private metricApiService = inject(MetricApiService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private translatableStringService = inject(TranslatableStringService);

  contextMenuSelection = signal<PaymentMetricDetails | undefined>(undefined);

  project = injectQuery(this.projectApiService.getProject(this.projectId));
  paymentStatus = injectQuery(
    this.paymentApiService.getPaymentStatus(this.projectId),
  );
  payment = injectQuery(() => ({
    ...this.paymentApiService.getPayment(this.projectId, this.paymentId)(),
    // Refetch the data every second if a payment is in progress
    staleTime: this.paymentStatus.data()?.inProgress ? 1000 : undefined,
  }));
  payments = injectQuery(this.paymentApiService.getPayments(this.projectId));
  transactions = injectQuery(
    this.metricApiService.getPaymentData({
      projectId: this.projectId,
      payment: this.paymentId,
    }),
  );

  allPaymentsLink = computed(() => [
    '/',
    AppRoutes.project,
    this.projectId(),
    AppRoutes.projectPayments,
  ]);

  paymentDate = computed(() => {
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

  paymentTitle = computed(() => {
    return $localize`Payment` + ' ' + this.paymentDate();
  });

  columns = computed(() => {
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
        field: 'status',
        header: $localize`Transfer status`,
        type: QueryTableColumnType.MULTISELECT,
        options: Object.entries(TRANSACTION_STATUS_LABELS).map(
          ([value, label]) => ({
            label,
            value,
          }),
        ),
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
    ];

    return projectPaymentColumns;
  });

  contextMenuItems = computed<MenuItem[]>(() => {
    const transaction = this.contextMenuSelection();

    if (!transaction) {
      return [];
    }

    return [
      {
        label: $localize`Go to profile`,
        icon: 'pi pi-user',
        command: () => {
          void this.router.navigate(
            registrationLink({
              projectId: this.projectId(),
              registrationId: transaction.registrationId,
            }),
          );
        },
      },
      {
        label: $localize`Retry failed transfers`,
        icon: 'pi pi-refresh',
        command: () => {
          // TODO AB#31728: Implement this
          this.toastService.showToast({
            detail:
              "Haven't done this yet. Here is a lollipop while you wait: 🍭",
          });
        },
        visible:
          this.canRetryTransfers() &&
          transaction.status === TransactionStatusEnum.error,
      },
    ];
  });

  localStorageKey = computed(
    () =>
      `project-payment-table-${this.projectId().toString()}-${this.paymentId().toString()}`,
  );

  canRetryTransfers = computed(() => {
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
      .data.some((payment) => payment.status === TransactionStatusEnum.error);
  });

  retryFailedTransfers() {
    // TODO AB#31728: Implement this
    this.toastService.showToast({
      detail: "Haven't done this yet. Here is a lollipop while you wait: 🍭",
    });
  }
}
