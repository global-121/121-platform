import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  Signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';

import { PageLayoutPaymentComponent } from '~/components/page-layout-payment/page-layout-payment.component';
import {
  QueryTableColumn,
  QueryTableColumnType,
  QueryTableComponent,
} from '~/components/query-table/query-table.component';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { PAYMENT_EVENT_LOG_ITEM_TYPE_LABELS } from '~/domains/payment/payment.helpers';
import { PaymentEventType } from '~/domains/payment/payment.model';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { TableCellPaymentEventActivityComponent } from '~/pages/project-payment-log/components/table-cell-payment-event-activity.component';
import { TableCellPaymentEventOverviewComponent } from '~/pages/project-payment-log/components/table-cell-payment-event-overview.component';
import { AuthService } from '~/services/auth.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';
import { TranslatableStringService } from '~/services/translatable-string.service';
import { getUniqueUserOptions } from '~/utils/unique-users';

interface PaymentLogTableCellContext {
  projectId: Signal<string>;
  currencyCode: Signal<string | undefined>;
}

@Component({
  selector: 'app-project-payment-log',
  imports: [
    PageLayoutPaymentComponent,
    CardModule,
    ButtonModule,
    SkeletonModule,
    QueryTableComponent,
  ],
  templateUrl: './project-payment-log.page.html',
  styles: ``,
  providers: [CurrencyPipe, DatePipe, DecimalPipe, ToastService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPaymentLogPageComponent {
  // this is injected by the router
  readonly projectId = input.required<string>();
  readonly paymentId = input.required<string>();

  readonly authService = inject(AuthService);
  readonly currencyPipe = inject(CurrencyPipe);
  readonly paymentApiService = inject(PaymentApiService);
  readonly projectApiService = inject(ProjectApiService);
  readonly rtlHelper = inject(RtlHelperService);
  readonly router = inject(Router);
  readonly toastService = inject(ToastService);
  readonly translatableStringService = inject(TranslatableStringService);

  project = injectQuery(this.projectApiService.getProject(this.projectId));

  readonly tableCellContext = computed<PaymentLogTableCellContext>(() => ({
    projectId: this.projectId,
    currencyCode: this.currencyCode,
  }));

  paymentEventLog = injectQuery(
    this.paymentApiService.getPaymentEvents({
      projectId: this.projectId,
      paymentId: this.paymentId,
    }),
  );

  readonly paymentEvents = computed(
    () => this.paymentEventLog.data()?.data ?? [],
  );
  readonly availablePaymentEventTypes = computed(
    () => this.paymentEventLog.data()?.meta.availableTypes ?? [],
  );

  readonly columns = computed<QueryTableColumn<PaymentEventType>[]>(() => [
    {
      field: 'type',
      header: $localize`Activity`,
      component: TableCellPaymentEventActivityComponent,
      type: QueryTableColumnType.MULTISELECT,
      options: this.availablePaymentEventTypes().map((type) => {
        const count = this.paymentEventLog.data()?.meta.count[type] ?? 0;
        return {
          label:
            PAYMENT_EVENT_LOG_ITEM_TYPE_LABELS[type] + ` (${String(count)})`,
          value: type,
        };
      }),
    },
    {
      header: $localize`Overview`,
      field: 'COMPUTED_FIELD',
      component: TableCellPaymentEventOverviewComponent,
    },
    {
      field: 'user.username',
      header: $localize`Done by`,
      type: QueryTableColumnType.MULTISELECT,
      options: getUniqueUserOptions(this.paymentEvents()),
    },
    {
      field: 'created',
      header: $localize`Date and time`,
      type: QueryTableColumnType.DATE,
    },
  ]);

  readonly currencyCode = computed(() => this.project.data()?.currency);
}
