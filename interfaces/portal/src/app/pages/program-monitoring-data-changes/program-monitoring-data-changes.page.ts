import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';

import { PageLayoutMonitoringComponent } from '~/components/page-layout-monitoring/page-layout-monitoring.component';
import {
  QueryTableColumn,
  QueryTableColumnType,
  QueryTableComponent,
} from '~/components/query-table/query-table.component';
import { registrationLink } from '~/domains/registration/registration.helper';
import { Activity } from '~/domains/registration/registration.model';
import { RegistrationAttributeService } from '~/services/registration-attribute.service';

@Component({
  selector: 'app-program-monitoring-data-changes',
  imports: [QueryTableComponent, PageLayoutMonitoringComponent],
  templateUrl: './program-monitoring-data-changes.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramMonitoringDataChangesPageComponent {
  readonly programId = input.required<string>();

  private readonly registrationAttributeService = inject(
    RegistrationAttributeService,
  );

  registrationAttributes = injectQuery(
    this.registrationAttributeService.getRegistrationAttributes(
      signal({
        programId: this.programId,
      }),
    ),
  );
  readonly columns = computed<QueryTableColumn<Activity>[]>(() => [
    {
      field: 'COMPUTED_FIELD',
      header: $localize`Field changed`,
      getCellText: () =>
        this.registrationAttributeService.localizeAttribute({
          attributes: this.registrationAttributes.data(),
          attributeName: '',
        }),
    },
    {
      field: 'COMPUTED_FIELD',
      header: $localize`Reg. #`,
      getCellText: (entity) => $localize`Reg. #` + entity.id,
      getCellRouterLink: (entity) =>
        registrationLink({
          programId: this.programId(),
          registrationId: entity.id,
        }),
    },
    {
      field: 'COMPUTED_FIELD',
      header: $localize`Old value`,
    },
    {
      field: 'COMPUTED_FIELD',
      header: $localize`New value`,
    },
    {
      field: 'user.username',
      header: $localize`Changed by`,
      displayAsChip: true,
    },
    {
      field: 'created',
      header: $localize`Date and time`,
      type: QueryTableColumnType.DATE,
    },
  ]);
}
