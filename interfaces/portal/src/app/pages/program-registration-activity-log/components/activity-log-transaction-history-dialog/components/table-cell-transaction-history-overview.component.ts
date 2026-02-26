import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { TableCellComponent } from '~/components/query-table/components/table-cell/table-cell.component';
import { TransactionEvent } from '~/domains/transaction/transaction.model';

@Component({
  selector: 'app-table-cell-transaction-history-overview',
  imports: [],
  template: `
    <span class="inline-flex items-center">
      <span class="me-4 inline leading-0">
        @if (icon()) {
          <i [class]="icon() + ' text-xl'"></i>
        }
      </span>
      <span>{{ label() }}</span>
    </span>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe],
})
export class TableCellTransactionHistoryOverviewComponent implements TableCellComponent<TransactionEvent> {
  readonly value = input.required<TransactionEvent>();
  readonly context = input<never>();
  readonly datePipe = inject(DatePipe);

  readonly label = computed(() => {
    const event = this.value();
    if (event.errorMessage) {
      return `${event.description} - Error: ${event.errorMessage}`;
    }
    return event.description;
  });
  readonly icon = computed(() => {
    const event = this.value();
    if (event.errorMessage) {
      return 'pi pi-exclamation-triangle';
    }
    return 'pi pi-check-circle';
  });
}
