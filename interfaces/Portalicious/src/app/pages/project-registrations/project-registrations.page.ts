import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ButtonGroupModule } from 'primeng/buttongroup';
import { CardModule } from 'primeng/card';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { RegistrationsTableComponent } from '~/components/registrations-table/registrations-table.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { registrationLink } from '~/domains/registration/registration.helper';
import { ChangeStatusDialogComponent } from '~/pages/project-registrations/components/change-status-dialog/change-status-dialog.component';
import { ExportRegistrationsComponent } from '~/pages/project-registrations/components/export-registrations/export-registrations.component';
import { ImportRegistrationsComponent } from '~/pages/project-registrations/components/import-registrations/import-registrations.component';
import { SendMessageDialogComponent } from '~/pages/project-registrations/components/send-message-dialog/send-message-dialog.component';
import { AuthService } from '~/services/auth.service';
import { ToastService } from '~/services/toast.service';
import { getOriginUrl } from '~/utils/url-helper';

@Component({
  selector: 'app-project-registrations',
  imports: [
    PageLayoutComponent,
    CardModule,
    ButtonModule,
    ButtonGroupModule,
    SendMessageDialogComponent,
    ExportRegistrationsComponent,
    ChangeStatusDialogComponent,
    ImportRegistrationsComponent,
    RegistrationsTableComponent,
  ],
  providers: [ToastService],
  templateUrl: './project-registrations.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectRegistrationsPageComponent {
  // this is injected by the router
  readonly projectId = input.required<string>();

  private authService = inject(AuthService);
  private router = inject(Router);
  private projectApiService = inject(ProjectApiService);
  private toastService = inject(ToastService);

  readonly registrationsTable =
    viewChild.required<RegistrationsTableComponent>('registrationsTable');
  readonly sendMessageDialog =
    viewChild.required<SendMessageDialogComponent>('sendMessageDialog');
  readonly changeStatusDialog =
    viewChild.required<ChangeStatusDialogComponent>('changeStatusDialog');

  RegistrationStatusEnum = RegistrationStatusEnum;

  project = injectQuery(this.projectApiService.getProject(this.projectId));

  sendMessage({
    triggeredFromContextMenu = false,
  }: {
    triggeredFromContextMenu?: boolean;
  } = {}) {
    const actionData = this.registrationsTable().getActionData({
      triggeredFromContextMenu,
    });

    if (!actionData) {
      return;
    }

    this.sendMessageDialog().triggerAction(actionData);
  }

  changeStatus({
    status,
    triggeredFromContextMenu = false,
  }: {
    status: RegistrationStatusEnum;
    triggeredFromContextMenu?: boolean;
  }) {
    const actionData = this.registrationsTable().getActionData({
      triggeredFromContextMenu,
    });

    if (!actionData) {
      return;
    }

    this.changeStatusDialog().triggerAction(actionData, status);
  }

  onActionComplete() {
    this.registrationsTable().resetSelection();
  }

  canChangeStatus = computed(
    () =>
      (
        status:
          | RegistrationStatusEnum.declined
          | RegistrationStatusEnum.deleted
          | RegistrationStatusEnum.included
          | RegistrationStatusEnum.paused
          | RegistrationStatusEnum.validated,
      ) => {
        if (
          status === RegistrationStatusEnum.validated &&
          !this.project.data()?.validation
        ) {
          return false;
        }

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
      },
  );

  canSendMessage = computed(() =>
    this.authService.hasPermission({
      projectId: this.projectId(),
      requiredPermission: PermissionEnum.RegistrationNotificationCREATE,
    }),
  );

  canImport = computed(() =>
    this.authService.hasAllPermissions({
      projectId: this.projectId(),
      requiredPermissions: [
        PermissionEnum.RegistrationCREATE,
        PermissionEnum.RegistrationImportTemplateREAD,
      ],
    }),
  );

  canExport = computed(() =>
    this.authService.hasPermission({
      projectId: this.projectId(),
      requiredPermission: PermissionEnum.RegistrationPersonalEXPORT,
    }),
  );

  contextMenuItems = computed<MenuItem[]>(() => {
    return [
      {
        label: $localize`Open in new tab`,
        icon: 'pi pi-user',
        command: () => {
          const registration =
            this.registrationsTable().contextMenuRegistration();
          if (!registration) {
            this.toastService.showGenericError();
            return;
          }
          const url = this.router.serializeUrl(
            this.router.createUrlTree(
              registrationLink({
                projectId: this.projectId(),
                registrationId: registration.id,
              }),
            ),
          );
          window.open(getOriginUrl() + url, '_blank');
        },
      },
      {
        label: $localize`Validate`,
        icon: 'pi pi-check-circle',
        visible: this.canChangeStatus()(RegistrationStatusEnum.validated),
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
        visible: this.canChangeStatus()(RegistrationStatusEnum.included),
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
        visible: this.canChangeStatus()(RegistrationStatusEnum.declined),
        command: () => {
          this.changeStatus({
            status: RegistrationStatusEnum.declined,
            triggeredFromContextMenu: true,
          });
        },
      },
      {
        label: $localize`Pause`,
        icon: 'pi pi-pause',
        visible: this.canChangeStatus()(RegistrationStatusEnum.paused),
        command: () => {
          this.changeStatus({
            status: RegistrationStatusEnum.paused,
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
        visible: this.canChangeStatus()(RegistrationStatusEnum.deleted),
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
