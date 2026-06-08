import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { injectQuery } from 'node_modules/@tanstack/angular-query-experimental/inject-query';
import { ButtonModule } from 'primeng/button';

import { PageLayoutMonitoringComponent } from '~/components/page-layout-monitoring/page-layout-monitoring.component';
import { QueryTableComponent } from '~/components/query-table/query-table.component';
import {
  QueryTableColumn,
  QueryTableColumnType,
} from '~/components/query-table/query-table.types';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { OrderDebitCardsDialogComponent } from '~/pages/program-monitoring-debit-cards/components/order-debit-cards-dialog.component';
import { PaginateQuery } from '~/services/paginate-query.service';
@Component({
  selector: 'app-program-monitoring-debit-cards',
  imports: [
    ButtonModule,
    ReactiveFormsModule,
    PageLayoutMonitoringComponent,
    QueryTableComponent,
    OrderDebitCardsDialogComponent,
  ],
  templateUrl: './program-monitoring-debit-cards.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [],
})
export class ProgramMonitoringDebitCardsPageComponent {
  readonly programId = input.required<string>();

  protected readonly paginateQuery = signal<PaginateQuery | undefined>(
    undefined,
  );

  protected readonly totalOrdered = computed(
    () => this.programOrderedVisaCards.data()?.meta.totalItems ?? 0,
  );

  readonly localStorageKey = computed(
    () => `program-ordered-visa-cards-table-${this.programId()}`,
  );

  private readonly orderedVisaCardsPaginateQuery = computed<PaginateQuery>(
    () => {
      const paginateQuery = this.paginateQuery() ?? {};
      return {
        ...paginateQuery,
        ...(paginateQuery.filter ?? {}),
      };
    },
  );

  private programApiService = inject(ProgramApiService);

  programOrderedVisaCards = injectQuery(
    this.programApiService.getOrderedVisaCards({
      programId: this.programId,
      paginateQuery: this.orderedVisaCardsPaginateQuery,
    }),
  );

  readonly orderVisaCards = computed(
    () => this.programOrderedVisaCards.data()?.data ?? [],
  );

  readonly orderDebitCardsDialog =
    viewChild.required<OrderDebitCardsDialogComponent>('orderDebitCardsDialog');

  readonly columns = computed<
    QueryTableColumn<{
      id: number;
      noOfCardsOrdered: number;
      address: string;
      orderedByUsername: string;
    }>[]
  >(() => [
    {
      field: 'noOfCardsOrdered',
      header: $localize`No of Cards Ordered`,
      type: QueryTableColumnType.TEXT,
    },
    {
      field: 'address',
      header: $localize`Address`,
      type: QueryTableColumnType.TEXT,
    },
    {
      field: 'orderedByUsername',
      header: $localize`Ordered By`,
      type: QueryTableColumnType.TEXT,
    },
  ]);

  handleOrderCardsClick(): void {
    this.orderDebitCardsDialog().show();
  }
}
