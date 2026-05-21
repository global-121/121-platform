import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  viewChild,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';

import { PageLayoutMonitoringComponent } from '~/components/page-layout-monitoring/page-layout-monitoring.component';
import { QueryTableComponent } from '~/components/query-table/query-table.component';
import {
  QueryTableColumn,
  QueryTableColumnType,
} from '~/components/query-table/query-table.types';
import { OrderDebitCardsDialogComponent } from '~/pages/program-monitoring-debit-cards/components/order-debit-cards-dialog.component';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-program-monitoring-debit-cards',
  imports: [
    ButtonModule,
    CheckboxModule,
    ReactiveFormsModule,
    PageLayoutMonitoringComponent,
    InputTextModule,
    QueryTableComponent,
    OrderDebitCardsDialogComponent,
  ],
  templateUrl: './program-monitoring-debit-cards.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ToastService],
})
export class ProgramMonitoringDebitCardsPageComponent {
  readonly programId = input.required<string>();

  readonly orderDebitCardsDialog =
    viewChild.required<OrderDebitCardsDialogComponent>('orderDebitCardsDialog');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- we don't have a type for this yet
  readonly columns = computed<QueryTableColumn<any>[]>(() => [
    {
      field: 'cardsOrders',
      header: $localize`Cards ordered`,
      type: QueryTableColumnType.TEXT,
    },
    {
      field: 'address',
      header: $localize`Address`,
      type: QueryTableColumnType.TEXT,
    },
    {
      field: 'userName',
      header: $localize`User name`,
      type: QueryTableColumnType.TEXT,
    },
    {
      field: 'dateOrdered',
      header: $localize`Date ordered`,
      type: QueryTableColumnType.DATE,
    },
  ]);

  handleOrderCardsClick(): void {
    this.orderDebitCardsDialog().show();
  }
}
