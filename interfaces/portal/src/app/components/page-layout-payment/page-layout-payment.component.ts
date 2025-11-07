import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
  signal,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { FspDto } from '@121-service/src/fsps/fsp.dto';
import { FSP_SETTINGS } from '@121-service/src/fsps/fsp-settings.const';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { AppRoutes } from '~/app.routes';
import { MetricTileComponent } from '~/components/metric-tile/metric-tile.component';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { ImportReconciliationDataComponent } from '~/components/page-layout-payment/components/import-reconciliation-data/import-reconciliation-data.component';
import { PaymentMenuComponent } from '~/components/page-layout-payment/components/payment-menu/payment-menu.component';
import { ProjectPaymentChartComponent } from '~/components/page-layout-payment/components/project-payment-chart/project-payment-chart.component';
import { SinglePaymentExportComponent } from '~/components/page-layout-payment/components/single-payment-export/single-payment-export.component';
import { StartPaymentComponent } from '~/components/page-layout-payment/components/start-payment/start-payment.component';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { PaymentAggregate } from '~/domains/payment/payment.model';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { projectHasFspWithExportFileIntegration } from '~/domains/project/project.helper';
import { AuthService } from '~/services/auth.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { TranslatableStringService } from '~/services/translatable-string.service';

import { TransactionStatusEnum } from '../../../../../../services/121-service/src/payments/transactions/enums/transaction-status.enum';

@Component({
  selector: 'app-page-layout-payment',
  imports: [
    PageLayoutComponent,
    CardModule,
    DecimalPipe,
    ButtonModule,
    MetricTileComponent,
    ProjectPaymentChartComponent,
    SkeletonModule,
    SinglePaymentExportComponent,
    ImportReconciliationDataComponent,
    PaymentMenuComponent,
    StartPaymentComponent,
  ],
  templateUrl: './page-layout-payment.component.html',
  styles: ``,
  providers: [CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageLayoutPaymentComponent {
  readonly projectId = input.required<string>();
  readonly paymentId = input.required<string>();

  readonly rtlHelper = inject(RtlHelperService);
  readonly currencyPipe = inject(CurrencyPipe);
  readonly locale = inject(LOCALE_ID);
  readonly paymentApiService = inject(PaymentApiService);
  readonly projectApiService = inject(ProjectApiService);
  readonly translatableStringService = inject(TranslatableStringService);

  readonly fspSettings = signal<Record<Fsps, FspDto>>(FSP_SETTINGS);
  private authService = inject(AuthService);

  project = injectQuery(this.projectApiService.getProject(this.projectId));
  paymentStatus = injectQuery(
    this.paymentApiService.getPaymentStatus(this.projectId),
  );
  payment = injectQuery(() => ({
    ...this.paymentApiService.getPayment({
      projectId: this.projectId,
      paymentId: this.paymentId,
    })(),
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
    this.paymentApiService.getPaymentTransactions({
      projectId: this.projectId,
      paymentId: this.paymentId,
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
        (payment) => payment.paymentId === Number(this.paymentId()),
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

    const totalTransferValue =
      this.payment.data().failed.transferValue +
      this.payment.data().success.transferValue +
      this.payment.data().waiting.transferValue +
      this.payment.data().created.transferValue;

    return (
      this.currencyPipe.transform(
        totalTransferValue,
        this.project.data()?.currency,
        'symbol-narrow',
        '1.2-2',
      ) ?? '0'
    );
  });

  readonly successfulPaymentsAmount = computed(() => {
    if (!this.payment.isSuccess()) {
      return '-';
    }

    return (
      this.currencyPipe.transform(
        this.payment.data().success.transferValue,
        this.project.data()?.currency,
        'symbol-narrow',
        '1.0-0',
      ) ?? '0'
    );
  });

  readonly hasFspWithExportFileIntegration = computed(() =>
    projectHasFspWithExportFileIntegration(this.project.data()),
  );

  readonly startPaymentFspList = computed<string>(() => {
    if (!this.transactions.isSuccess()) {
      return '';
    }

    return Array.from(
      new Set(
        this.transactions
          .data()
          .map((transaction) => transaction.programFspConfigurationName),
      ),
    )
      .map((fspName) => this.fspLabel(fspName)())
      .join(', ');
  });

  readonly fspLabel = (fspName: string) =>
    computed<string>(() => {
      if (!this.fspSettings()[fspName]) {
        return fspName;
      }

      const setting = this.fspSettings()[fspName] as FspDto;

      const translatedFspLabel = this.translatableStringService.translate(
        setting.defaultLabel,
      );

      if (!translatedFspLabel) {
        return fspName;
      }

      return translatedFspLabel;
    });

  readonly startPaymentTransactionCount = computed<string>(() => {
    if (!this.payment.isSuccess()) {
      return '';
    }
    return (
      this.payment.data().created.count.toString() +
      ' ' +
      $localize`registrations`
    );
  });

  readonly startPaymentTotalPaymentAmount = computed<string>(() => {
    if (!this.payment.isSuccess()) {
      return '';
    }

    return (
      this.currencyPipe.transform(
        this.payment.data().created.transferValue,
        this.project.data()?.currency,
        'symbol-narrow',
        '1.2-2',
      ) ?? '0'
    );
  });

  readonly showStartPaymentButton = computed<boolean>(() => {
    if (!this.transactions.isSuccess()) {
      return false;
    }

    return this.transactions
      .data()
      .some(
        (transaction) => transaction.status === TransactionStatusEnum.created,
      );
  });

  readonly canStartPayment = computed(() =>
    this.authService.hasAllPermissions({
      projectId: this.projectId(),
      requiredPermissions: [
        PermissionEnum.PaymentREAD,
        PermissionEnum.PaymentUPDATE,
        PermissionEnum.PaymentTransactionREAD,
      ],
    }),
  );

  isPaymentInProgress(): boolean | undefined {
    return (
      this.paymentStatus.isPending() ||
      this.transactions.isPending() ||
      this.paymentStatus.data()?.inProgress
    );
  }

  chipLabel(): string | undefined {
    return this.isPaymentInProgress()
      ? $localize`:@@inProgressChipLabel:In progress`
      : undefined;
  }
  chipTooltip(): string | undefined {
    return this.isPaymentInProgress()
      ? $localize`:@@inProgressChipTooltip:The payment will be in progress while the transfers in the table below are loading.`
      : undefined;
  }
}
