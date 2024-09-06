import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TabMenuModule } from 'primeng/tabmenu';
import { DataListComponent } from '~/components/data-list/data-list.component';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { RegistrationActivityLogEntry } from '~/domains/registration/registration.model';
import { TransactionApiService } from '~/domains/transaction/transaction.api.service';

@Component({
  selector: 'app-project-registration-activity-log',
  standalone: true,
  imports: [
    PageLayoutComponent,
    CardModule,
    TabMenuModule,
    CommonModule,
    FormsModule,
    SelectButtonModule,
    TableModule,
    ButtonModule,
    DataListComponent,
  ],
  templateUrl: './project-registration-activity-log.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectRegistrationActivityLogPageComponent {
  // this is injected by the router
  projectId = input.required<number>();
  registrationId = input.required<number>();

  registrationService = inject(RegistrationApiService);
  transactionService = inject(TransactionApiService);

  referenceId = injectQuery(
    this.registrationService.getRegistrationReferenceId(
      this.projectId,
      this.registrationId,
    ),
  );

  registrationEvents = injectQuery(() => ({
    ...this.registrationService.getRegistrationEvents(
      this.projectId,
      this.registrationId,
    )(),
    enabled: !!this.projectId() && !!this.registrationId(),
  }));

  registrationMessageHistory = injectQuery(() => ({
    ...this.registrationService.getMessageHistory(
      this.projectId,
      this.referenceId.data() ?? '',
    )(),
    enabled: !!this.projectId() && !!this.referenceId.isSuccess(),
  }));

  registrationTransactions = injectQuery(() => ({
    ...this.transactionService.getRegistrationTransactions(
      this.projectId,
      this.referenceId.data() ?? '',
    )(),
    enabled: () => !!this.projectId() && !!this.referenceId.isSuccess(),
  }));

  activityLog = computed<RegistrationActivityLogEntry[]>(() => [
    ...(this.registrationEvents.data() ?? []),
    ...(this.registrationMessageHistory.data() ?? []),
    ...(this.registrationTransactions.data() ?? []),
  ]);

  //NOTE: had to set the width (in px, couldn't in rem) because the Activity column would change width on expand
  columns = computed(() => [
    {
      field: 'activityType',
      header: $localize`Activity`,
      width: '176px',
    },
    {
      field: 'overview',
      header: $localize`Overview`,
      width: '480px',
    },
    {
      field: 'doneBy',
      header: $localize`Done by`,
      width: '160px',
    },
    {
      field: 'timestamp',
      header: $localize`Time and date`,
      type: 'date',
      width: '176px',
    },
  ]);

  stateOptions = [
    { label: 'Show all', value: 'all' },
    { label: 'Transfers', value: 'transfers' },
    { label: 'Messages', value: 'messages' },
    { label: 'Notes', value: 'notes' },
    { label: 'Status updates', value: 'status-updates' },
    { label: 'Data changes', value: 'data-changes' },
  ];
  value = 'all';

  onRowExpand($event) {
    console.log(
      '🚀 ~ ProjectRegistrationActivityLogPageComponent ~ onRowExpand ~ $event:',
      $event,
    );
  }
  onRowCollapse($event) {
    console.log(
      '🚀 ~ ProjectRegistrationActivityLogPageComponent ~ onRowCollapse ~ $event:',
      $event,
    );
  }
}
