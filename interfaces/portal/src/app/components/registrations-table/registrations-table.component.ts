import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  inject,
  input,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { QueryTableComponent } from '~/components/query-table/query-table.component';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { Registration } from '~/domains/registration/registration.model';
import { PaginateQuery } from '~/services/paginate-query.service';
import { RegistrationsTableColumnService } from '~/services/registrations-table-column.service';

@Component({
  selector: 'app-registrations-table',
  imports: [QueryTableComponent, NgTemplateOutlet],
  templateUrl: './registrations-table.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationsTableComponent {
  readonly programId = input.required<string>();
  readonly contextMenuItems = input<MenuItem[]>();
  readonly localStorageKey = input<string>();
  readonly overrideFilters = input<Exclude<PaginateQuery['filter'], undefined>>(
    {},
  );
  readonly showSelectionInHeader = input<boolean>(false);

  readonly emptyMessage =
    contentChild<TemplateRef<unknown>>('tableEmptyMessage');

  private programApiService = inject(ProgramApiService);
  private registrationApiService = inject(RegistrationApiService);
  private registrationsTableColumnService = inject(
    RegistrationsTableColumnService,
  );

  PermissionEnum = PermissionEnum;

  readonly table =
    viewChild.required<QueryTableComponent<Registration, never>>('table');

  protected RegistrationStatusEnum = RegistrationStatusEnum;
  protected readonly paginateQuery = signal<PaginateQuery | undefined>(
    undefined,
  );
  public readonly contextMenuRegistration = signal<Registration | undefined>(
    undefined,
  );

  private readonly registrationsPaginateQuery = computed<PaginateQuery>(() => {
    const paginateQuery = this.paginateQuery() ?? {};
    return {
      ...paginateQuery,
      filter: {
        ...(paginateQuery.filter ?? {}),
        ...this.overrideFilters(),
      },
    };
  });

  protected program = injectQuery(
    this.programApiService.getProgram(this.programId),
  );

  protected registrationsResponse = injectQuery(
    this.registrationApiService.getManyByQuery(
      this.programId,
      this.registrationsPaginateQuery,
    ),
  );

  protected tableColumns = injectQuery(
    this.registrationsTableColumnService.getColumns(this.programId),
  );

  protected readonly registrations = computed(
    () => this.registrationsResponse.data()?.data ?? [],
  );
  protected readonly totalRegistrations = computed(
    () => this.registrationsResponse.data()?.meta.totalItems ?? 0,
  );

  protected readonly columns = computed(() => {
    if (!this.program.isSuccess() || !this.tableColumns.isSuccess()) {
      return [];
    }
    const registrationTableColumns = this.tableColumns.data();

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
    return this.table().getActionData({
      triggeredFromContextMenu,
      contextMenuItem: this.contextMenuRegistration(),
      fieldForFilter: 'referenceId',
      currentPaginateQuery: this.registrationsPaginateQuery(),
      noSelectionToastMessage: $localize`:@@no-registrations-selected:Select one or more registrations and try again.`,
    });
  }

  public resetSelection() {
    this.table().resetSelection();
  }
}
