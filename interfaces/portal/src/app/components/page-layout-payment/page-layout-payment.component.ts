import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
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
import { TimelineModule } from 'primeng/timeline';

import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { FspSettingsDto } from '@121-service/src/fsp-management/fsp-settings.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { AppRoutes } from '~/app.routes';
import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';
import { ColoredChipPaymentApprovalStatusComponent } from '~/components/colored-chip-payment-approval-status/colored-chip-payment-approval-status.component';
import { MetricTileComponent } from '~/components/metric-tile/metric-tile.component';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { ApprovePaymentComponent } from '~/components/page-layout-payment/components/approve-payment/approve-payment.component';
import { ImportReconciliationDataComponent } from '~/components/page-layout-payment/components/import-reconciliation-data/import-reconciliation-data.component';
import { PaymentMenuComponent } from '~/components/page-layout-payment/components/payment-menu/payment-menu.component';
import { ProgramPaymentChartComponent } from '~/components/page-layout-payment/components/program-payment-chart/program-payment-chart.component';
import { SinglePaymentExportComponent } from '~/components/page-layout-payment/components/single-payment-export/single-payment-export.component';
import { StartPaymentComponent } from '~/components/page-layout-payment/components/start-payment/start-payment.component';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
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
    ApprovePaymentComponent,
    ColoredChipComponent,
    ColoredChipPaymentApprovalStatusComponent,
    CommonModule,
    TimelineModule,
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
  readonly TransactionStatusEnum = TransactionStatusEnum;

  readonly fspSettings = signal<Record<Fsps, FspSettingsDto>>(FSP_SETTINGS);
  private authService = inject(AuthService);

  program = injectQuery(this.programApiService.getProgram(this.programId));
  paymentStatus = injectQuery(
    this.paymentApiService.getPaymentStatus(this.programId),
  );
  paymentAggregate = injectQuery(() => ({
    ...this.paymentApiService.getPaymentAggregationFull({
      programId: this.programId,
      paymentId: this.paymentId,
    })(),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || !this.totalTransactions()) {
        return 1000;
      }

      const isPaymentWaitingToStart =
        data.approved.count + data.pendingApproval.count ===
        this.totalTransactions();

      const isPaymentFinished =
        data.success.count + data.failed.count === this.totalTransactions();

      if (isPaymentWaitingToStart || isPaymentFinished) {
        return false;
      }

      return 1000;
    },
  }));
  payments = injectQuery(
    this.paymentApiService.getPaymentAggregationsSummaries(this.programId),
  );

  readonly paymentAggregateData = computed(() => this.paymentAggregate.data());

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
    () => this.transactionsResponse.data()?.meta.totalItems,
  );

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
    if (!this.paymentAggregate.isSuccess()) {
      return '-';
    }

    const totalRegistrations =
      this.paymentAggregate.data().failed.count +
      this.paymentAggregate.data().success.count +
      this.paymentAggregate.data().waiting.count +
      this.paymentAggregate.data().pendingApproval.count +
      this.paymentAggregate.data().approved.count;

    return totalRegistrations.toString();
  });

  readonly totalPaymentAmount = computed(() => {
    if (!this.paymentAggregate.isSuccess()) {
      return '-';
    }

    const totalTransferValue =
      this.paymentAggregate.data().failed.transferValue +
      this.paymentAggregate.data().success.transferValue +
      this.paymentAggregate.data().waiting.transferValue +
      this.paymentAggregate.data().pendingApproval.transferValue +
      this.paymentAggregate.data().approved.transferValue;

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
    if (!this.paymentAggregate.isSuccess()) {
      return '-';
    }

    return (
      this.currencyPipe.transform(
        this.paymentAggregate.data().success.transferValue,
        this.program.data()?.currency,
        'symbol-narrow',
        '1.0-0',
      ) ?? '0'
    );
  });

  readonly firstPendingApprovalRank = computed(() => {
    if (!this.paymentAggregate.isSuccess()) {
      return 0;
    }

    return Math.min(
      ...this.paymentAggregate
        .data()
        .approvalStatus.filter((a) => !a.approved)
        .map((a) => a.rank),
    );
  });

  readonly hasFspWithExportFileIntegration = computed(() =>
    programHasFspWithExportFileIntegration(this.program.data()),
  );

  readonly paymentFspList = computed<string>(() => {
    if (!this.paymentAggregate.isSuccess()) {
      return '';
    }

    const fspLabels = this.paymentAggregate
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

  readonly paymentTransactionCountByStatus = (
    transactionStatus:
      | TransactionStatusEnum.approved
      | TransactionStatusEnum.pendingApproval,
  ) =>
    computed<string>(() => {
      if (!this.paymentAggregate.isSuccess()) {
        return '';
      }
      const count = this.paymentAggregate.data()[transactionStatus].count;
      return count.toString() + ' ' + $localize`registrations`;
    });

  readonly paymentTotalTransferValueByStatus = (
    status:
      | TransactionStatusEnum.approved
      | TransactionStatusEnum.pendingApproval,
  ) =>
    computed<string>(() => {
      if (!this.paymentAggregate.isSuccess()) {
        return '';
      }
      const totalPaymentAmount =
        this.paymentAggregate.data()[status].transferValue;

      return (
        this.currencyPipe.transform(
          totalPaymentAmount,
          this.program.data()?.currency,
          'symbol-narrow',
          '1.2-2',
        ) ?? '0'
      );
    });

  readonly showApprovePaymentButton = computed<boolean | undefined>(() => {
    if (!this.paymentAggregate.isSuccess()) {
      return false;
    }

    if (this.isPaymentInProgress()) {
      return false;
    }

    const approvalStatus = this.paymentAggregate.data().approvalStatus;
    const currentPaymentApproval = approvalStatus.find((approval) =>
      approval.approvers.includes(this.authService.user?.username ?? ''),
    );
    if (!currentPaymentApproval) {
      return false; // not approver for this payment
    }
    if (currentPaymentApproval.approved) {
      return false; // already approved
    }

    // NOTE 1: we do not hide the button if previous approvers have not yet approved, to avoid confusion. Instead, the backend will block the approval action.
    // NOTE 2: there is no permission-check here, as there is no approve permission.

    return true;
  });

  readonly showStartPaymentButton = computed<boolean | undefined>(() => {
    if (!this.isPaymentReadyToStart()) {
      return false;
    }

    if (!this.hasStartPaymentPermissions()) {
      return false;
    }

    return true;
  });

  readonly isPaymentReadyToStart = computed(() => {
    if (!this.paymentAggregate.isSuccess()) {
      return false;
    }

    if (this.isPaymentInProgress()) {
      return false;
    }

    const approvalStatus = this.paymentAggregate.data().approvalStatus;
    if (approvalStatus.some((approval) => !approval.approved)) {
      return false;
    }

    // hide after starting, unless approved transactions left
    if (this.paymentAggregate.data().approved.count === 0) {
      return false;
    }

    return true;
  });

  readonly hasStartPaymentPermissions = computed(() =>
    this.authService.hasAllPermissions({
      programId: this.programId(),
      requiredPermissions: [
        PermissionEnum.PaymentREAD,
        PermissionEnum.PaymentSTART,
        PermissionEnum.PaymentTransactionREAD,
      ],
    }),
  );

  readonly isPaymentApproved = computed(() => {
    if (!this.paymentAggregate.isSuccess()) {
      return false;
    }

    const data = this.paymentAggregate.data();

    const failed = data.failed.count;
    const success = data.success.count;
    const waiting = data.waiting.count;
    const approved = data.approved.count;

    return failed + success + waiting + approved > 0;
  });

  readonly statusBadgeLabel = computed(() => {
    if (!this.paymentAggregate.isSuccess()) {
      return '';
    }

    if (this.isPaymentApproved()) {
      return $localize`Approved`;
    }

    const approvalData = this.paymentAggregate.data().approvalStatus;
    const approvedCount = approvalData.filter((status) => status.approved);
    const totalCount = approvalData.length;

    return $localize`${approvedCount.length} of ${totalCount} approved`;
  });

  readonly statusBadgeColor = computed(() => {
    if (!this.paymentAggregate.isSuccess()) {
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

  readonly getApproverLabel = (approvers: string[]) =>
    computed(() =>
      approvers.length > 0
        ? approvers.join(', ')
        : $localize`:@@approverDeleted:Approver deleted. Create new payment.`,
    );
}
