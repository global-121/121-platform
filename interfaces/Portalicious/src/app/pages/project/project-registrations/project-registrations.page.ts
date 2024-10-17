import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

import { AppRoutes } from '~/app.routes';
import { getChipDataByRegistrationStatus } from '~/components/colored-chip/colored-chip.helper';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import {
  QueryTableColumn,
  QueryTableColumnType,
  QueryTableComponent,
  QueryTableSelectionEvent,
} from '~/components/query-table/query-table.component';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { REGISTRATION_STATUS_LABELS } from '~/domains/registration/registration.helper';
import { Registration } from '~/domains/registration/registration.model';
import {
  PaginateQuery,
  PaginateQueryService,
} from '~/services/paginate-query.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-project-registrations',
  standalone: true,
  imports: [PageLayoutComponent, CardModule, QueryTableComponent, ButtonModule],
  providers: [ToastService],
  templateUrl: './project-registrations.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectRegistrationsPageComponent {
  // this is injected by the router
  projectId = input.required<number>();

  private paginateQueryService = inject(PaginateQueryService);
  private registrationApiService = inject(RegistrationApiService);
  private toastService = inject(ToastService);

  paginateQuery = signal<PaginateQuery | undefined>(undefined);
  tableSelection = signal<QueryTableSelectionEvent<Registration>>([]);

  registrationsResponse = injectQuery(
    this.registrationApiService.getManyByQuery(
      this.projectId,
      this.paginateQuery,
    ),
  );

  registrations = computed(() => this.registrationsResponse.data()?.data ?? []);
  totalRegistrations = computed(
    () => this.registrationsResponse.data()?.meta.totalItems ?? 0,
  );

  columns = computed<QueryTableColumn<Registration>[]>(() => [
    {
      field: 'personAffectedSequence',
      fieldForSort: 'registrationProgramId',
      header: $localize`PA #`,
      getCellRouterLink: (registration) =>
        this.registrationLink(registration.id),
    },
    {
      field: 'fullName',
      header: $localize`:@@registration-full-name:Full Name`,
      getCellRouterLink: (registration) =>
        this.registrationLink(registration.id),
    },
    {
      field: 'registrationCreated',
      fieldForFilter: 'registrationCreatedDate',
      header: $localize`:@@registration-created:Registration created`,
      type: QueryTableColumnType.DATE,
    },
    {
      field: 'status',
      header: $localize`:@@registration-status:Status`,
      type: QueryTableColumnType.MULTISELECT,
      options: Object.entries(REGISTRATION_STATUS_LABELS).map(
        ([value, label]) => ({
          label,
          value,
        }),
      ),
      getCellChipData: (registration) =>
        getChipDataByRegistrationStatus(registration.status),
    },
  ]);

  private registrationLink = (registrationId: number) => [
    '/',
    AppRoutes.project,
    this.projectId(),
    AppRoutes.projectRegistrations,
    registrationId,
  ];

  private get actionData() {
    return this.paginateQueryService.selectionEventToActionData({
      selection: this.tableSelection(),
      fieldForFilter: 'referenceId',
      totalCount: this.totalRegistrations(),
      currentPaginateQuery: this.paginateQuery(),
      onEmptySelection: () => {
        this.toastService.showToast({
          severity: 'error',
          detail: $localize`:@@no-registrations-selected:Select one or more registrations and try again.`,
        });
      },
    });
  }

  sendMessage() {
    const actionData = this.actionData;

    if (!actionData) {
      return;
    }

    // TODO: Instead of showing a toast, do something with the data
    console.log(actionData);
    this.toastService.showToast({
      severity: 'info',
      detail: actionData.selectAll
        ? `Sending message to all filtered registrations (${actionData.count.toString()})`
        : `Sending message to the ${actionData.count.toString()} selected registration(s)`,
    });
  }
}
