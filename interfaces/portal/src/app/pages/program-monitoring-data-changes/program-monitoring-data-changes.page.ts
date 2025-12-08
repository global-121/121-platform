import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';

import { RegistrationEventEnum } from '@121-service/src/registration-events/enum/registration-event.enum';

import { PageLayoutMonitoringComponent } from '~/components/page-layout-monitoring/page-layout-monitoring.component';
import {
  QueryTableColumn,
  QueryTableColumnType,
  QueryTableComponent,
} from '~/components/query-table/query-table.component';
import { EventApiService } from '~/domains/event/event.api.service';
import { RegistrationEvent } from '~/domains/event/event.model';
import { registrationLink } from '~/domains/registration/registration.helper';
import { PaginateQuery } from '~/services/paginate-query.service';
import { RegistrationAttributeService } from '~/services/registration-attribute.service';
import { getUniqueUserOptions } from '~/utils/unique-users';

@Component({
  selector: 'app-program-monitoring-data-changes',
  imports: [QueryTableComponent, PageLayoutMonitoringComponent],
  templateUrl: './program-monitoring-data-changes.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramMonitoringDataChangesPageComponent {
  readonly programId = input.required<string>();
  protected readonly paginateQuery = signal<PaginateQuery | undefined>({});
  public readonly contextMenuRegistrationEvent = signal<
    RegistrationEvent | undefined
  >(undefined);

  private readonly eventApiService = inject(EventApiService);
  private readonly registrationAttributeService = inject(
    RegistrationAttributeService,
  );

  private readonly eventsPaginateQuery = computed<PaginateQuery>(() => {
    const paginateQuery = this.paginateQuery() ?? {};
    return {
      ...paginateQuery,
      filter: {
        ...(paginateQuery.filter ?? {}),
      },
    };
  });

  registrationAttributes = injectQuery(
    this.registrationAttributeService.getRegistrationAttributes(
      signal({
        programId: this.programId,
      }),
    ),
  );

  eventsResponse = injectQuery(
    this.eventApiService.getEventsPaginated({
      programId: this.programId,
      paginateQuery: this.eventsPaginateQuery,
    }),
  );
  readonly events = computed(() => this.eventsResponse.data()?.data ?? []);
  protected readonly totalEvents = computed(
    () => this.eventsResponse.data()?.meta.totalItems ?? 0,
  );

  readonly columns = computed<QueryTableColumn<RegistrationEvent>[]>(() => [
    {
      field: 'type',
      header: $localize`Type`,
      type: QueryTableColumnType.MULTISELECT,
      options: [
        {
          label: $localize`Data change`,
          value: RegistrationEventEnum.registrationDataChange,
        },
        {
          label: $localize`FSP change`,
          value: RegistrationEventEnum.fspChange,
        },
        {
          label: $localize`Ignored duplicate`,
          value: RegistrationEventEnum.ignoredDuplicate,
        },
      ],
    },
    {
      field: 'fieldChanged', // ##TODO make this a dropdown.
      header: $localize`Field changed`,
      getCellText: (event) =>
        this.registrationAttributeService.localizeAttribute({
          attributes: this.registrationAttributes.data(),
          attributeName: event.fieldChanged,
        }),
    },
    {
      field: 'registrationProgramId',
      header: $localize`Reg. #`,
      getCellText: (event) =>
        $localize`Reg. # ${event.registrationProgramId.toString()}`,
      getCellRouterLink: (event) =>
        registrationLink({
          programId: this.programId(),
          registrationId: event.registrationId,
        }),
      type: QueryTableColumnType.NUMERIC,
    },
    {
      field: 'oldValue',
      header: $localize`Old value`,
      getCellText: (event) =>
        this.registrationAttributeService.localizeAttribute({
          attributes: this.registrationAttributes.data(),
          attributeName: event.fieldChanged,
          attributeOptionValue: event.oldValue,
        }),
    },
    {
      field: 'newValue',
      header: $localize`New value`,
      getCellText: (event) =>
        this.registrationAttributeService.localizeAttribute({
          attributes: this.registrationAttributes.data(),
          attributeName: event.fieldChanged,
          attributeOptionValue: event.newValue,
        }),
    },
    {
      field: 'username',
      header: $localize`Changed by`,
      displayAsChip: true,
      type: QueryTableColumnType.MULTISELECT,
      options: getUniqueUserOptions(
        this.events().map((e) => ({
          user: { username: e.username },
        })),
      ),
    },
    {
      field: 'created',
      header: $localize`Date and time`,
      type: QueryTableColumnType.DATE,
    },
    {
      field: 'reason',
      header: $localize`Change reason`, // ##TODO: reason should only pop into view upon horizontal scroll??
    },
  ]);

  // ##TODO create context menu item for 'go to profile'
}
