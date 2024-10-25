import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';
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
import { ChangeStatusDialogComponent } from '~/pages/project-registrations/components/change-status-dialog/change-status-dialog.component';
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
    ChangeStatusDialogComponent,
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
  private router = inject(Router);
  private paginateQueryService = inject(PaginateQueryService);
  private registrationApiService = inject(RegistrationApiService);
  private projectApiService = inject(ProjectApiService);
  private toastService = inject(ToastService);

  PermissionEnum = PermissionEnum;

  @ViewChild('sendMessageDialog')
  private sendMessageDialog: SendMessageDialogComponent;
  @ViewChild('changeStatusDialog')
  private changeStatusDialog: ChangeStatusDialogComponent;

  RegistrationStatusEnum = RegistrationStatusEnum;
  paginateQuery = signal<PaginateQuery | undefined>(undefined);
  tableSelection = signal<QueryTableSelectionEvent<Registration>>([]);
  contextMenuRegistration = signal<Registration | undefined>(undefined);

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

  private getActionData({
    triggeredFromContextMenu,
  }: {
    // registration to be used if no selection is made
    triggeredFromContextMenu: boolean;
  }) {
    const selection = this.tableSelection();

    if (Array.isArray(selection) && selection.length === 0) {
      if (triggeredFromContextMenu) {
        const contextMenuRegistration = this.contextMenuRegistration();
        if (!contextMenuRegistration) {
          this.toastService.showGenericError();
          return;
        }
        selection.push(contextMenuRegistration);
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
      currentPaginateQuery: this.paginateQuery(),
      previewItemForSelectAll: this.registrations()[0],
    });
  }

  sendMessage({
    triggeredFromContextMenu = false,
  }: {
    triggeredFromContextMenu?: boolean;
  } = {}) {
    const actionData = this.getActionData({
      triggeredFromContextMenu,
    });

    if (!actionData) {
      return;
    }

    this.sendMessageDialog.triggerAction(actionData);
  }

  changeStatus({
    status,
    triggeredFromContextMenu = false,
  }: {
    status: RegistrationStatusEnum;
    triggeredFromContextMenu?: boolean;
  }) {
    const actionData = this.getActionData({
      triggeredFromContextMenu,
    });

    if (!actionData) {
      return;
    }

    this.changeStatusDialog.triggerAction(actionData, status);
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

  contextMenuItems = computed<MenuItem[]>(() => {
    return [
      {
        label: $localize`Go to profile`,
        icon: 'pi pi-user',
        command: () => {
          const registration = this.contextMenuRegistration();
          if (!registration) {
            this.toastService.showGenericError();
            return;
          }
          void this.router.navigate(this.registrationLink(registration.id));
        },
      },
      {
        label: $localize`Validate`,
        icon: 'pi pi-check-circle',
        visible: this.canChangeStatus(RegistrationStatusEnum.validated),
        command: () => {
          this.changeStatus({
            status: RegistrationStatusEnum.validated,
            triggeredFromContextMenu: true,
          });
        },
      },
      {
        label: $localize`Include`,
        icon: 'pi pi-check',
        visible: this.canChangeStatus(RegistrationStatusEnum.included),
        command: () => {
          this.changeStatus({
            status: RegistrationStatusEnum.included,
            triggeredFromContextMenu: true,
          });
        },
      },
      {
        label: $localize`Decline`,
        icon: 'pi pi-times',
        visible: this.canChangeStatus(RegistrationStatusEnum.declined),
        command: () => {
          this.changeStatus({
            status: RegistrationStatusEnum.declined,
            triggeredFromContextMenu: true,
          });
        },
      },
      {
        label: $localize`Message`,
        icon: 'pi pi-envelope',
        visible: this.canSendMessage(),
        command: () => {
          this.sendMessage({
            triggeredFromContextMenu: true,
          });
        },
      },
      {
        label: $localize`Delete`,
        icon: 'pi pi-trash',
        visible: this.canChangeStatus(RegistrationStatusEnum.deleted),
        command: () => {
          this.changeStatus({
            status: RegistrationStatusEnum.deleted,
            triggeredFromContextMenu: true,
          });
        },
      },
    ];
  });
}
