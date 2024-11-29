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
  QueryTableSelectionEvent,
} from '~/components/query-table/query-table.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import {
  REGISTRATION_STATUS_LABELS,
  registrationLink,
} from '~/domains/registration/registration.helper';
import { Registration } from '~/domains/registration/registration.model';
import {
  PaginateQuery,
  PaginateQueryService,
} from '~/services/paginate-query.service';
import { ToastService } from '~/services/toast.service';
import { TranslatableStringService } from '~/services/translatable-string.service';

@Component({
  selector: 'app-registrations-table',
  standalone: true,
  imports: [QueryTableComponent],
  templateUrl: './registrations-table.component.html',
  styles: ``,
  providers: [ToastService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationsTableComponent {
  projectId = input.required<number>();
  contextMenuItems = input<MenuItem[]>();
  localStorageKey = input<string>();
  overrideFilters = input<Exclude<PaginateQuery['filter'], undefined>>({});

  private paginateQueryService = inject(PaginateQueryService);
  private projectApiService = inject(ProjectApiService);
  private registrationApiService = inject(RegistrationApiService);
  private toastService = inject(ToastService);
  private translatableStringService = inject(TranslatableStringService);

  PermissionEnum = PermissionEnum;

  @ViewChild('table')
  private table: QueryTableComponent<Registration, never>;

  protected RegistrationStatusEnum = RegistrationStatusEnum;
  protected paginateQuery = signal<PaginateQuery | undefined>(undefined);
  protected tableSelection = signal<QueryTableSelectionEvent<Registration>>([]);
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
        field: 'fullName',
        header: $localize`:@@registration-full-name:Full Name`,
        getCellRouterLink: (registration) =>
          registrationLink({
            projectId: this.projectId(),
            registrationId: registration.id,
          }),
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

    registrationTableColumns.forEach((column) => {
      column.disableFiltering =
        !!column.field &&
        Object.keys(this.overrideFilters()).includes(column.field);
    });

    return registrationTableColumns;
  });

  public getActionData({
    triggeredFromContextMenu = false,
  }: {
    triggeredFromContextMenu?: boolean;
  } = {}) {
    let selection = this.tableSelection();

    if (Array.isArray(selection) && selection.length === 0) {
      if (triggeredFromContextMenu) {
        const contextMenuRegistration = this.contextMenuRegistration();
        if (!contextMenuRegistration) {
          this.toastService.showGenericError();
          return;
        }
        selection = [contextMenuRegistration];
      } else {
        this.toastService.showToast({
          severity: 'error',
          detail: $localize`:@@no-registrations-selected:Select one or more registrations and try again.`,
        });
        return;
      }
    }

    return this.paginateQueryService.selectionEventToActionData({
      selection,
      fieldForFilter: 'referenceId',
      totalCount: this.totalRegistrations(),
      currentPaginateQuery: this.registrationsPaginateQuery(),
      previewItemForSelectAll: this.registrations()[0],
    });
  }

  public resetSelection() {
    this.table.resetSelection();
  }
}
