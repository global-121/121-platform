import { CurrencyPipe, DatePipe } from '@angular/common';
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

import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { FspSettingsDto } from '@121-service/src/fsp-management/fsp-settings.dto';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { AppRoutes } from '~/app.routes';
import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';
import { MetricTileComponent } from '~/components/metric-tile/metric-tile.component';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { ImportReconciliationDataComponent } from '~/components/page-layout-payment/components/import-reconciliation-data/import-reconciliation-data.component';
import { PaymentMenuComponent } from '~/components/page-layout-payment/components/payment-menu/payment-menu.component';
import { ProgramPaymentChartComponent } from '~/components/page-layout-payment/components/program-payment-chart/program-payment-chart.component';
import { SinglePaymentExportComponent } from '~/components/page-layout-payment/components/single-payment-export/single-payment-export.component';
import { StartPaymentComponent } from '~/components/page-layout-payment/components/start-payment/start-payment.component';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { PaymentAggregate } from '~/domains/payment/payment.model';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { programHasFspWithExportFileIntegration } from '~/domains/program/program.helper';
import { AuthService } from '~/services/auth.service';
import { PaginateQuery } from '~/services/paginate-query.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { TranslatableStringService } from '~/services/translatable-string.service';
import { Locale } from '~/utils/locale';
@Component({
  selector: 'app-page-layout-payment',
  imports: [
    PageLayoutComponent,
    CardModule,
    ButtonModule,
    MetricTileComponent,
    ProgramPaymentChartComponent,
    SkeletonModule,
    SinglePaymentExportComponent,
    ImportReconciliationDataComponent,
    PaymentMenuComponent,
    StartPaymentComponent,
    ColoredChipComponent,
  ],
  templateUrl: './page-layout-payment.component.html',
  styles: ``,
  providers: [CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageLayoutPaymentComponent {
  readonly programId = input.required<string>();
  readonly paymentId = input.required<string>();

  readonly rtlHelper = inject(RtlHelperService);
  readonly currencyPipe = inject(CurrencyPipe);
  readonly locale = inject<Locale>(LOCALE_ID);
  readonly paymentApiService = inject(PaymentApiService);
  readonly programApiService = inject(ProgramApiService);
  readonly translatableStringService = inject(TranslatableStringService);

  readonly fspSettings = signal<Record<Fsps, FspSettingsDto>>(FSP_SETTINGS);
  private authService = inject(AuthService);

  program = injectQuery(this.programApiService.getProgram(this.programId));
  paymentStatus = injectQuery(
    this.paymentApiService.getPaymentStatus(this.programId),
  );
  payment = injectQuery(() => ({
    ...this.paymentApiService.getPayment({
      programId: this.programId,
      paymentId: this.paymentId,
    })(),
    // Refetch the data every second if a payment count !== transactions count
    refetchInterval: this.refetchPayment() ? 1000 : undefined,
    success: (data: PaymentAggregate) => {
      if (
        data.success.count +
          data.failed.count +
          data.waiting.count +
          data.approved.count +
          data.pendingApproval.count ===
        this.totalTransactions()
      ) {
        this.refetchPayment.set(false);
      }
    },
  }));
  payments = injectQuery(this.paymentApiService.getPayments(this.programId));

  protected readonly paginateQuery = signal<PaginateQuery | undefined>(
    undefined,
  );

  private readonly transactionsPaginateQuery = computed<PaginateQuery>(() => {
    const paginateQuery = this.paginateQuery() ?? {};
    return {
      ...paginateQuery,
    };
  });

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

  readonly allPaymentsLink = computed(() => [
    '/',
    AppRoutes.program,
    this.programId(),
    AppRoutes.programPayments,
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

  readonly totalRegistrations = computed(() => {
    if (!this.payment.isSuccess()) {
      return '-';
    }

    const totalRegistrations =
      this.payment.data().failed.count +
      this.payment.data().success.count +
      this.payment.data().waiting.count +
      this.payment.data().pendingApproval.count +
      this.payment.data().approved.count;

    return totalRegistrations.toString();
  });

  readonly totalPaymentAmount = computed(() => {
    if (!this.payment.isSuccess()) {
      return '-';
    }

    const totalTransferValue =
      this.payment.data().failed.transferValue +
      this.payment.data().success.transferValue +
      this.payment.data().waiting.transferValue +
      this.payment.data().pendingApproval.transferValue +
      this.payment.data().approved.transferValue;

    return (
      this.currencyPipe.transform(
        totalTransferValue,
        this.program.data()?.currency,
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
        this.program.data()?.currency,
        'symbol-narrow',
        '1.0-0',
      ) ?? '0'
    );
  });

  readonly hasFspWithExportFileIntegration = computed(() =>
    programHasFspWithExportFileIntegration(this.program.data()),
  );

  readonly startPaymentFspList = computed<string>(() => {
    if (!this.payment.isSuccess()) {
      return '';
    }

    const fspLabels = this.payment
      .data()
      .fsps.map(
        (fsp) =>
          this.translatableStringService.translate(
            fsp.programFspConfigurationLabel,
          ) ??
          fsp.programFspConfigurationName ??
          '',
      );

    return this.translatableStringService.commaSeparatedList({
      values: fspLabels,
    });
  });

  readonly startPaymentTransactionCount = computed<string>(() => {
    if (!this.payment.isSuccess()) {
      return '';
    }
    return (
      this.payment.data().pendingApproval.count.toString() +
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
        this.payment.data().pendingApproval.transferValue,
        this.program.data()?.currency,
        'symbol-narrow',
        '1.2-2',
      ) ?? '0'
    );
  });

  readonly showStartPaymentButton = computed<boolean | undefined>(() => {
    if (!this.payment.isSuccess()) {
      return false;
    }

    return (
      this.payment.data().pendingApproval.count > 0 &&
      !this.isPaymentInProgress()
    );
  });

  readonly canStartPayment = computed(() =>
    this.authService.hasAllPermissions({
      programId: this.programId(),
      requiredPermissions: [
        PermissionEnum.PaymentREAD,
        PermissionEnum.PaymentUPDATE,
        PermissionEnum.PaymentTransactionREAD,
      ],
    }),
  );

  readonly isPaymentApproved = computed(() => {
    if (!this.payment.isSuccess()) {
      return false;
    }

    const data = this.payment.data();

    const failed = data.failed.count;
    const success = data.success.count;
    const waiting = data.waiting.count;
    const approved = data.approved.count;

    return failed + success + waiting + approved > 0;
  });

  readonly statusBadgeLabel = computed(() => {
    if (!this.payment.isSuccess()) {
      return '';
    }

    // TODO: see if a payment status enum is needed
    if (this.isPaymentApproved()) {
      return $localize`Approved`;
    }

    return $localize`Pending approval`;
  });

  readonly statusBadgeColor = computed(() => {
    if (!this.payment.isSuccess()) {
      return 'blue';
    }

    if (this.isPaymentApproved()) {
      return 'purple';
    }

    return 'orange';
  });

  readonly isPaymentInProgress = computed<boolean | undefined>(
    () =>
      this.paymentStatus.isPending() ||
      this.transactionsResponse.isPending() ||
      this.paymentStatus.data()?.inProgress,
  );

  readonly chipLabel = computed<string | undefined>(() =>
    this.isPaymentInProgress()
      ? $localize`:@@inProgressChipLabel:In progress`
      : undefined,
  );

  readonly chipTooltip = computed<string | undefined>(() =>
    this.isPaymentInProgress()
      ? $localize`:@@inProgressChipTooltip:The payment will be in progress while the transactions in the table below are loading.`
      : undefined,
  );
}
