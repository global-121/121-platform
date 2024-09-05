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
import { CardModule } from 'primeng/card';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TabMenuModule } from 'primeng/tabmenu';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { QueryTableColumn } from '~/components/query-table/query-table.component';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { RegistrationActivityLogEntry } from '~/domains/registration/registration.model';

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

  activityLog = computed<RegistrationActivityLogEntry[]>(() => [
    ...(this.registrationEvents.data() ?? []),
    ...(this.registrationMessageHistory.data() ?? []),
  ]);

  columns = computed<QueryTableColumn<RegistrationActivityLogEntry>[]>(() => [
    {
      field: 'activityType',
      header: $localize`Activity`,
    },
    {
      field: 'overview',
      header: $localize`Overview`,
    },
    {
      field: 'doneBy',
      header: $localize`Done by`,
    },
    {
      field: 'timestamp',
      header: $localize`Time and date`,
      type: 'date',
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
}
