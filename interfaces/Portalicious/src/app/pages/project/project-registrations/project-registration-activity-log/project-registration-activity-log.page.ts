import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { uniqBy } from 'lodash';
import { SelectButtonModule } from 'primeng/selectbutton';

import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import {
  QueryTableColumn,
  QueryTableComponent,
} from '~/components/query-table/query-table.component';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { ACTIVITY_LOG_ITEM_TYPE_LABELS } from '~/domains/registration/registration.helpers';
import {
  ActivityLogItemType,
  ActivityLogItemWithOverview,
} from '~/domains/registration/registration.model';
import { ActivityLogExpandedRowComponent } from '~/pages/project/project-registrations/project-registration-activity-log/components/activity-log-expanded-row/activity-log-expanded-row.component';
import { TableCellActivityComponent } from '~/pages/project/project-registrations/project-registration-activity-log/components/table-cell-activity.component';
import { TableCellOverviewComponent } from '~/pages/project/project-registrations/project-registration-activity-log/components/table-cell-overview.component';

@Component({
  selector: 'app-project-registration-activity-log',
  standalone: true,
  imports: [
    PageLayoutComponent,
    FormsModule,
    SelectButtonModule,
    QueryTableComponent,
  ],
  templateUrl: './project-registration-activity-log.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectRegistrationActivityLogPageComponent {
  // this is injected by the router
  projectId = input.required<number>();
  registrationId = input.required<number>();

  registrationApiService = inject(RegistrationApiService);

  expandableRowTemplate = ActivityLogExpandedRowComponent;
  expandableRowContext = computed(() => ({
    projectId: this.projectId,
    referenceId: this.registration.data()?.referenceId,
  }));

  registration = injectQuery(
    this.registrationApiService.getRegistrationById(
      this.projectId,
      this.registrationId,
    ),
  );

  activityLog = injectQuery(
    this.registrationApiService.getActivityLog(
      this.projectId,
      this.registrationId,
    ),
  );

  items = computed(() => this.activityLog.data()?.data ?? []);

  uniqueAuthors = computed(() => {
    return uniqBy(
      this.items().map(({ author }) => ({
        label: author,
        value: author,
      })),
      'value',
    ).sort((a, b) => a.label.localeCompare(b.label));
  });

  columns = computed<QueryTableColumn<ActivityLogItemWithOverview>[]>(() => [
    {
      field: 'activityType',
      header: $localize`Activity`,
      component: TableCellActivityComponent,
      type: 'multiselect',
      options: Object.entries(this.activityLog.data()?.meta.count ?? {}).map(
        ([type, count]) => ({
          label:
            ACTIVITY_LOG_ITEM_TYPE_LABELS[type as ActivityLogItemType] +
            ` (${String(count)})`,
          value: type,
        }),
      ),
    },
    {
      header: $localize`Overview`,
      field: 'overview',
      component: TableCellOverviewComponent,
    },
    {
      field: 'author',
      header: $localize`Done by`,
      type: 'multiselect',
      options: this.uniqueAuthors(),
    },
    {
      field: 'date',
      header: $localize`Time and date`,
      type: 'date',
    },
  ]);
}
