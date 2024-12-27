import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  ViewChild,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { getChipDataByRegistrationStatus } from '~/components/colored-chip/colored-chip.helper';
import {
  QueryTableColumn,
  QueryTableColumnType,
  QueryTableComponent,
} from '~/components/query-table/query-table.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import {
  REGISTRATION_STATUS_LABELS,
  registrationLink,
} from '~/domains/registration/registration.helper';
import { Registration } from '~/domains/registration/registration.model';
import { PaginateQuery } from '~/services/paginate-query.service';
import { TranslatableStringService } from '~/services/translatable-string.service';

@Component({
  selector: 'app-registrations-table',
  standalone: true,
  imports: [QueryTableComponent],
  templateUrl: './registrations-table.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationsTableComponent {
  projectId = input.required<string>();
  contextMenuItems = input<MenuItem[]>();
  localStorageKey = input<string>();
  overrideFilters = input<Exclude<PaginateQuery['filter'], undefined>>({});
  showSelectionInHeader = input<boolean>(false);

  private projectApiService = inject(ProjectApiService);
  private registrationApiService = inject(RegistrationApiService);
  private translatableStringService = inject(TranslatableStringService);

  PermissionEnum = PermissionEnum;

  @ViewChild('table')
  private table: QueryTableComponent<Registration, never>;

  protected RegistrationStatusEnum = RegistrationStatusEnum;
  protected paginateQuery = signal<PaginateQuery | undefined>(undefined);
  public contextMenuRegistration = signal<Registration | undefined>(undefined);

  private registrationsPaginateQuery = computed<PaginateQuery>(() => {
    const paginateQuery = this.paginateQuery() ?? {};
    return {
      ...paginateQuery,
      filter: {
        ...(paginateQuery.filter ?? {}),
        ...this.overrideFilters(),
      },
    };
  });

  protected project = injectQuery(
    this.projectApiService.getProject(this.projectId),
  );

  protected registrationsResponse = injectQuery(
    this.registrationApiService.getManyByQuery(
      this.projectId,
      this.registrationsPaginateQuery,
    ),
  );

  protected registrations = computed(
    () => this.registrationsResponse.data()?.data ?? [],
  );
  protected totalRegistrations = computed(
    () => this.registrationsResponse.data()?.meta.totalItems ?? 0,
  );

  protected columns = computed(() => {
    if (!this.project.isSuccess()) {
      return [];
    }

    const registrationTableColumns: QueryTableColumn<Registration>[] = [
      {
        field: 'registrationProgramId',
        header: $localize`Reg. #`,
        getCellText: (registration) =>
          `Reg. #${registration.registrationProgramId.toString()}`,
        getCellRouterLink: (registration) =>
          registrationLink({
            projectId: this.projectId(),
            registrationId: registration.id,
          }),
      },
      {
        field: 'name',
        header: $localize`:@@registration-full-name:Name`,
        getCellRouterLink: (registration) =>
          registrationLink({
            projectId: this.projectId(),
            registrationId: registration.id,
          }),
        fieldForFilter: 'fullName',
        fieldForSort: 'fullName',
      },
      {
        field: 'status',
        header: $localize`:@@registration-status:Status`,
        type: QueryTableColumnType.MULTISELECT,
        options: Object.values(RegistrationStatusEnum)
          .filter((status) => status !== RegistrationStatusEnum.deleted)
          .map((status) => ({
            label: REGISTRATION_STATUS_LABELS[status],
            value: status,
          })),
        getCellChipData: (registration) =>
          getChipDataByRegistrationStatus(registration.status),
      },
      {
        field: 'programFinancialServiceProviderConfigurationName',
        header: $localize`FSP`,
        type: QueryTableColumnType.MULTISELECT,
        options: this.project
          .data()
          .programFinancialServiceProviderConfigurations.map((config) => ({
            label: this.translatableStringService.translate(config.label) ?? '',
            value: config.name,
          })),
      },
      {
        field: 'registrationCreated',
        fieldForFilter: 'registrationCreatedDate',
        header: $localize`:@@registration-created:Registration created`,
        type: QueryTableColumnType.DATE,
        defaultHidden: true,
      },
    ];

    return registrationTableColumns.filter(
      (column) =>
        !column.field ||
        // For example, hide the "status" column when we are forcing a filter by status
        !Object.keys(this.overrideFilters()).includes(column.field),
    );
  });

  public getActionData({
    triggeredFromContextMenu = false,
  }: {
    triggeredFromContextMenu?: boolean;
  } = {}) {
    return this.table.getActionData({
      triggeredFromContextMenu,
      contextMenuItem: this.contextMenuRegistration(),
      fieldForFilter: 'referenceId',
      currentPaginateQuery: this.registrationsPaginateQuery(),
      noSelectionToastMessage: $localize`:@@no-registrations-selected:Select one or more registrations and try again.`,
    });
  }

  public resetSelection() {
    this.table.resetSelection();
  }
}
