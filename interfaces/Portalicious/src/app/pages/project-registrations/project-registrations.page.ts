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
import { ButtonModule } from 'primeng/button';
import { ButtonGroupModule } from 'primeng/buttongroup';
import { CardModule } from 'primeng/card';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { AppRoutes } from '~/app.routes';
import { getChipDataByRegistrationStatus } from '~/components/colored-chip/colored-chip.helper';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import {
  QueryTableColumn,
  QueryTableColumnType,
  QueryTableComponent,
  QueryTableSelectionEvent,
} from '~/components/query-table/query-table.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { REGISTRATION_STATUS_LABELS } from '~/domains/registration/registration.helper';
import { Registration } from '~/domains/registration/registration.model';
import { SendMessageDialogComponent } from '~/pages/project-registrations/components/send-message-dialog/send-message-dialog.component';
import { AuthService } from '~/services/auth.service';
import {
  PaginateQuery,
  PaginateQueryService,
} from '~/services/paginate-query.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-project-registrations',
  standalone: true,
  imports: [
    PageLayoutComponent,
    CardModule,
    QueryTableComponent,
    ButtonModule,
    ButtonGroupModule,
    SendMessageDialogComponent,
  ],
  providers: [ToastService],
  templateUrl: './project-registrations.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectRegistrationsPageComponent {
  // this is injected by the router
  projectId = input.required<number>();

  public authService = inject(AuthService);
  private paginateQueryService = inject(PaginateQueryService);
  private registrationApiService = inject(RegistrationApiService);
  private projectApiService = inject(ProjectApiService);
  private toastService = inject(ToastService);

  PermissionEnum = PermissionEnum;

  @ViewChild('sendMessageDialog')
  private sendMessageDialog: SendMessageDialogComponent;

  RegistrationStatusEnum = RegistrationStatusEnum;
  paginateQuery = signal<PaginateQuery | undefined>(undefined);
  tableSelection = signal<QueryTableSelectionEvent<Registration>>([]);

  registrationsResponse = injectQuery(
    this.registrationApiService.getManyByQuery(
      this.projectId,
      this.paginateQuery,
    ),
  );

  project = injectQuery(this.projectApiService.getProject(this.projectId));

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

  private getActionData() {
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

  previewRegistration = computed(() => {
    const tableSelection = this.tableSelection();

    if ('selectAll' in tableSelection) {
      return this.registrations()[0];
    }

    return tableSelection[0];
  });

  sendMessage() {
    const actionData = this.getActionData();

    if (!actionData) {
      return;
    }

    this.sendMessageDialog.triggerAction(actionData);
  }

  changeStatus(status: RegistrationStatusEnum) {
    const actionData = this.getActionData();

    if (!actionData) {
      return;
    }

    // TODO: Instead of showing a toast, do something with the data
    console.log(actionData);
    this.toastService.showToast({
      severity: 'info',
      detail: actionData.selectAll
        ? `Applying status: ${status} on all filtered registrations (${actionData.count.toString()})`
        : `Applying status: ${status} on the ${actionData.count.toString()} selected registration(s)`,
    });
  }

  canChangeStatus(
    status:
      | RegistrationStatusEnum.declined
      | RegistrationStatusEnum.deleted
      | RegistrationStatusEnum.included
      | RegistrationStatusEnum.paused
      | RegistrationStatusEnum.validated,
  ) {
    const statusToPermissionMap = {
      [RegistrationStatusEnum.validated]:
        PermissionEnum.RegistrationStatusMarkAsValidatedUPDATE,
      [RegistrationStatusEnum.included]:
        PermissionEnum.RegistrationStatusIncludedUPDATE,
      [RegistrationStatusEnum.declined]:
        PermissionEnum.RegistrationStatusMarkAsDeclinedUPDATE,
      [RegistrationStatusEnum.deleted]: PermissionEnum.RegistrationDELETE,
      [RegistrationStatusEnum.paused]:
        PermissionEnum.RegistrationStatusPausedUPDATE,
    };
    return this.authService.hasPermission({
      projectId: this.projectId(),
      requiredPermission: statusToPermissionMap[status],
    });
  }

  canSendMessage = computed(() =>
    this.authService.hasPermission({
      projectId: this.projectId(),
      requiredPermission: PermissionEnum.RegistrationNotificationCREATE,
    }),
  );
}
