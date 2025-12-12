import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';

import { PageLayoutMonitoringComponent } from '~/components/page-layout-monitoring/page-layout-monitoring.component';
import {
  QueryTableColumn,
  QueryTableColumnType,
  QueryTableComponent,
} from '~/components/query-table/query-table.component';
import { registrationLink } from '~/domains/registration/registration.helper';
import { RegistrationEventApiService } from '~/domains/registration-event/registration-event.api.service';
import { RegistrationEvent } from '~/domains/registration-event/registration-event.model';
import { PaginateQuery } from '~/services/paginate-query.service';
import { RegistrationAttributeService } from '~/services/registration-attribute.service';
import { getUniqueUserOptions } from '~/utils/unique-users';
import { getOriginUrl } from '~/utils/url-helper';

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

  readonly contextMenuSelection = signal<RegistrationEvent | undefined>(
    undefined,
  );
  private readonly eventApiService = inject(RegistrationEventApiService);
  private readonly registrationAttributeService = inject(
    RegistrationAttributeService,
  );
  private readonly router = inject(Router);

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
    this.eventApiService.getRegistrationEventsMonitoring({
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
      field: 'fieldChanged',
      header: $localize`Field changed`,
      type: QueryTableColumnType.MULTISELECT,
      options:
        this.registrationAttributes.data()?.map((attr) => ({
          label: this.registrationAttributeService.localizeAttribute({
            attributes: this.registrationAttributes.data(),
            attributeName: attr.name,
          }),
          value: attr.name,
        })) ?? [],
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
      disableFiltering: true,
      disableSorting: true,
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
      disableFiltering: true,
      disableSorting: true,
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
      disableFiltering: true,
    },
    {
      field: 'reason',
      header: $localize`Change reason`,
    },
  ]);

  readonly contextMenuItems = computed<MenuItem[]>(() => {
    const registrationEvent = this.contextMenuSelection();

    if (!registrationEvent) {
      return [];
    }

    return [
      {
        label: $localize`Open in new tab`,
        icon: 'pi pi-user',
        command: () => {
          const url = this.router.serializeUrl(
            this.router.createUrlTree(
              registrationLink({
                programId: this.programId(),
                registrationId: registrationEvent.registrationId,
              }),
            ),
          );
          window.open(getOriginUrl() + url, '_blank');
        },
      },
    ];
  });
}
