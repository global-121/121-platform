import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  Signal,
  signal,
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
import { PaymentTransaction } from '~/domains/payment/payment.model';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { AuthService } from '~/services/auth.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';
import { TranslatableStringService } from '~/services/translatable-string.service';
import { getUniqueUserOptions } from '~/utils/unique-users';
import { TableCellPaymentEventActivityComponent } from './components/table-cell-payment-event-activity.component';
import { PAYMENT_EVENT_LOG_ITEM_TYPE_LABELS } from '~/domains/payment/payment.helpers';
import { TableCellPaymentEventOverviewComponent } from './components/table-cell-payment-event-overview.component copy';

export interface PaymentLogTableCellContext {
  projectId: Signal<string>;
  currencyCode: Signal<string | undefined>;
}

export interface PaymentLogEvent {
  id: number;
  type: string;
  created: string;
  user: {
    id: number;
    username: string;
  };
  attributes: {
    note?: string;
  };
}

interface MockPaymentEventLogResult {
  data: () =>
    | {
        meta: {
          availableTypes: string[];
          count: Record<string, number>;
        };
        data: PaymentLogEvent[];
      }
    | undefined;
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

  readonly contextMenuSelection = signal<PaymentTransaction | undefined>(
    undefined,
  );

  project = injectQuery(this.projectApiService.getProject(this.projectId));

  readonly tableCellContext = computed<PaymentLogTableCellContext>(() => ({
    projectId: this.projectId,
    currencyCode: this.currencyCode,
  }));

  createMockActivityLog = (): MockPaymentEventLogResult => ({
    data: () => ({
      meta: {
        availableTypes: ['note', 'created'],
        count: {
          note: 1,
          created: 1,
        },
      },
      data: [
        {
          id: 2,
          type: 'note',
          created: '2025-08-22T12:43:02.390Z',
          user: {
            id: 1,
            username: 'admin@example.org',
          },
          attributes: {
            note: '121 is great!',
          },
        },
        {
          id: 1,
          type: 'created',
          created: '2025-08-22T12:43:02.389Z',
          user: {
            id: 1,
            username: 'admin@example.org',
          },
          attributes: {},
        },
      ],
    }),
  });

  // activityLog = this.createMockActivityLog();
  activityLog = injectQuery(
    this.paymentApiService.getPaymentEvents({
      projectId: this.projectId,
      paymentId: this.paymentId,
    }),
  );

  readonly activities = computed(() => this.activityLog.data()?.data ?? []);
  readonly availableActivityTypes = computed(
    () => this.activityLog.data()?.meta.availableTypes ?? [],
  );

  readonly columns = computed<QueryTableColumn<PaymentLogEvent>[]>(() => [
    {
      field: 'type',
      header: $localize`Activity`,
      component: TableCellPaymentEventActivityComponent,
      type: QueryTableColumnType.MULTISELECT,
      options: this.availableActivityTypes().map((type) => {
        const count = this.activityLog.data()?.meta.count[type] ?? 0;
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
      options: getUniqueUserOptions(this.activities()),
    },
    {
      field: 'created',
      header: $localize`Date and time`,
      type: QueryTableColumnType.DATE,
    },
  ]);

  readonly currencyCode = computed(() => this.project.data()?.currency);
}
