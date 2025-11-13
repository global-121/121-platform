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

import { ManualLinkComponent } from '~/components/manual-link/manual-link.component';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { RegistrationsTableComponent } from '~/components/registrations-table/registrations-table.component';
import { ProgramApiService } from '~/domains/program/program.api.service';
import {
  REGISTRATION_STATUS_ICON,
  REGISTRATION_STATUS_VERB,
  registrationLink,
} from '~/domains/registration/registration.helper';
import { RegistrationStatusChangeTarget } from '~/domains/registration/registration.model';
import { ChangeStatusDialogComponent } from '~/pages/program-registrations/components/change-status-dialog/change-status-dialog.component';
import { ExportRegistrationsComponent } from '~/pages/program-registrations/components/export-registrations/export-registrations.component';
import { ImportRegistrationsMenuComponent } from '~/pages/program-registrations/components/import-registrations-menu/import-registrations-menu.component';
import { SendMessageDialogComponent } from '~/pages/program-registrations/components/send-message-dialog/send-message-dialog.component';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';
import { AuthService } from '~/services/auth.service';
import { RegistrationActionMenuService } from '~/services/registration-action-menu.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';
import {
  TrackingAction,
  TrackingCategory,
  TrackingService,
} from '~/services/tracking.service';
import { getOriginUrl } from '~/utils/url-helper';

@Component({
  selector: 'app-program-registrations',
  imports: [
    PageLayoutComponent,
    CardModule,
    ButtonModule,
    ButtonGroupModule,
    SendMessageDialogComponent,
    ExportRegistrationsComponent,
    ChangeStatusDialogComponent,
    RegistrationsTableComponent,
    TranslatableStringPipe,
    ImportRegistrationsMenuComponent,
    ManualLinkComponent,
  ],
  providers: [ToastService],
  templateUrl: './program-registrations.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramRegistrationsPageComponent {
  readonly rtlHelper = inject(RtlHelperService);
  // this is injected by the router
  readonly programId = input.required<string>();

  private authService = inject(AuthService);
  private router = inject(Router);
  private programApiService = inject(ProgramApiService);
  private toastService = inject(ToastService);
  readonly registrationMenuService = inject(RegistrationActionMenuService);
  readonly trackingService = inject(TrackingService);

  readonly registrationsTable =
    viewChild.required<RegistrationsTableComponent>('registrationsTable');
  readonly sendMessageDialog =
    viewChild.required<SendMessageDialogComponent>('sendMessageDialog');
  readonly changeStatusDialog =
    viewChild.required<ChangeStatusDialogComponent>('changeStatusDialog');

  RegistrationStatusEnum = RegistrationStatusEnum;
  REGISTRATION_STATUS_ICON = REGISTRATION_STATUS_ICON;
  REGISTRATION_STATUS_VERB = REGISTRATION_STATUS_VERB;

  program = injectQuery(this.programApiService.getProgram(this.programId));

  readonly canChangeStatus = computed(
    () => (status: RegistrationStatusChangeTarget) =>
      this.registrationMenuService.canChangeStatus({
        status,
        programId: this.programId(),
        hasValidation: !!this.program.data()?.validation,
      }),
  );

  readonly canSendMessage = computed(() =>
    this.registrationMenuService.canSendMessage({
      programId: this.programId(),
    }),
  );
  readonly canImport = computed(() =>
    this.authService.hasAllPermissions({
      programId: this.programId(),
      requiredPermissions: [
        PermissionEnum.RegistrationCREATE,
        PermissionEnum.RegistrationImportTemplateREAD,
      ],
    }),
  );
  readonly canExport = computed(() =>
    this.authService.hasPermission({
      programId: this.programId(),
      requiredPermission: PermissionEnum.RegistrationPersonalEXPORT,
    }),
  );
  readonly contextMenuItems = computed<MenuItem[]>(() => [
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
              programId: this.programId(),
              registrationId: registration.id,
            }),
          ),
        );

        window.open(getOriginUrl() + url, '_blank');

        this.trackingService.trackEvent({
          category: TrackingCategory.manageRegistrations,
          action: TrackingAction.selectContextMenuOption,
          name: `open-in-new-tab`,
        });
      },
    },
    this.registrationMenuService.createContextItemForMessage({
      programId: this.programId(),
      command: () => {
        this.sendMessage({
          triggeredFromContextMenu: true,
        });
      },
    }),
    {
      separator: true,
    },
    this.createContextItemForRegistrationStatusChange(
      RegistrationStatusEnum.validated,
    ),
    this.createContextItemForRegistrationStatusChange(
      RegistrationStatusEnum.included,
    ),
    this.createContextItemForRegistrationStatusChange(
      RegistrationStatusEnum.declined,
    ),
    this.createContextItemForRegistrationStatusChange(
      RegistrationStatusEnum.paused,
    ),
    this.createContextItemForRegistrationStatusChange(
      RegistrationStatusEnum.deleted,
    ),
  ]);

  sendMessage({
    triggeredFromContextMenu = false,
  }: {
    triggeredFromContextMenu?: boolean;
  } = {}) {
    const actionData = this.registrationsTable().getActionData({
      triggeredFromContextMenu,
    });

    if (!actionData) {
      this.trackingService.trackEvent({
        category: TrackingCategory.manageRegistrations,
        action: triggeredFromContextMenu
          ? TrackingAction.selectContextMenuOption
          : TrackingAction.clickBulkActionButton,
        name: `send-message for:none`,
      });
      return;
    }

    this.trackingService.trackEvent({
      category: TrackingCategory.manageRegistrations,
      action: triggeredFromContextMenu
        ? TrackingAction.selectContextMenuOption
        : TrackingAction.clickBulkActionButton,
      name: `send-message for:${actionData.selectAll ? 'all' : 'selection'}`,
      value: actionData.count > 0 ? actionData.count : undefined,
    });

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
      this.trackingService.trackEvent({
        category: TrackingCategory.manageRegistrations,
        action: triggeredFromContextMenu
          ? TrackingAction.selectContextMenuOption
          : TrackingAction.clickBulkActionButton,
        name: `change-status:${status} for:none`,
      });
      return;
    }

    this.trackingService.trackEvent({
      category: TrackingCategory.manageRegistrations,
      action: triggeredFromContextMenu
        ? TrackingAction.selectContextMenuOption
        : TrackingAction.clickBulkActionButton,
      name: `change-status:${status} for:${actionData.selectAll ? 'all' : 'selection'}`,
      value: actionData.count > 0 ? actionData.count : undefined,
    });

    this.changeStatusDialog().triggerAction(actionData, status);
  }

  onActionComplete() {
    this.registrationsTable().resetSelection();
  }

  private createContextItemForRegistrationStatusChange(
    status: RegistrationStatusChangeTarget,
  ) {
    return this.registrationMenuService.createContextItemForRegistrationStatusChange(
      {
        status,
        programId: this.programId(),
        hasValidation: !!this.program.data()?.validation,
        command: () => {
          this.changeStatus({
            status,
            triggeredFromContextMenu: true,
          });
        },
      },
    );
  }
}
