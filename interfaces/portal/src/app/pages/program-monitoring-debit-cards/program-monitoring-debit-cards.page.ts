import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { injectQuery } from 'node_modules/@tanstack/angular-query-experimental/inject-query';
import { ButtonModule } from 'primeng/button';

import { VisaCardOrderResponseDto } from '@121-service/src/fsp-integrations/account-management/intersolve-visa/dto/visa-card-order-response.dto';

import { PageLayoutMonitoringComponent } from '~/components/page-layout-monitoring/page-layout-monitoring.component';
import { QueryTableComponent } from '~/components/query-table/query-table.component';
import {
  QueryTableColumn,
  QueryTableColumnType,
} from '~/components/query-table/query-table.types';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { OrderDebitCardsDialogComponent } from '~/pages/program-monitoring-debit-cards/components/order-debit-cards-dialog.component';
import { Dto } from '~/utils/dto-type';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramMonitoringDebitCardsPageComponent {
  private programApiService = inject(ProgramApiService);
  readonly programId = input.required<string>();

  programOrderedVisaCards = injectQuery(
    this.programApiService.getOrderedVisaCards({
      programId: this.programId,
    }),
  );

  readonly orderDebitCardsDialog =
    viewChild.required<OrderDebitCardsDialogComponent>('orderDebitCardsDialog');

  readonly columns = computed<
    QueryTableColumn<Dto<VisaCardOrderResponseDto>>[]
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
    {
      field: 'created',
      header: $localize`Created At`,
      type: QueryTableColumnType.DATE,
      disableFiltering: true,
    },
  ]);

  handleOrderCardsClick(): void {
    this.orderDebitCardsDialog().show();
  }
}
