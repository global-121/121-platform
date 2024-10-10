import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { CardModule } from 'primeng/card';

import { AppRoutes } from '~/app.routes';
import { getChipDataByRegistrationStatus } from '~/components/colored-chip/colored-chip.helper';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import {
  QueryTableColumn,
  QueryTableColumnType,
  QueryTableComponent,
} from '~/components/query-table/query-table.component';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { REGISTRATION_STATUS_LABELS } from '~/domains/registration/registration.helper';
import { FindAllRegistrationsResult } from '~/domains/registration/registration.model';
import { PaginateQuery } from '~/services/paginate-query.service';

@Component({
  selector: 'app-project-registrations',
  standalone: true,
  imports: [PageLayoutComponent, CardModule, QueryTableComponent],
  templateUrl: './project-registrations.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectRegistrationsPageComponent {
  // this is injected by the router
  projectId = input.required<number>();

  private registrationApiService = inject(RegistrationApiService);

  paginateQuery = signal<PaginateQuery | undefined>(undefined);

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

  columns = computed<QueryTableColumn<FindAllRegistrationsResult['data'][0]>[]>(
    () => [
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
    ],
  );

  registrationLink = (registrationId: number) => [
    '/',
    AppRoutes.project,
    this.projectId(),
    AppRoutes.projectRegistrations,
    registrationId,
  ];
}
