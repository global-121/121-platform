import { inject, Injectable } from '@angular/core';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import {
  REGISTRATION_STATUS_ICON,
  REGISTRATION_STATUS_VERB,
} from '~/domains/registration/registration.helper';
import { RegistrationStatusChangeTarget } from '~/domains/registration/registration.model';
import { AuthService } from '~/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class RegistrationActionMenuService {
  private readonly authService = inject(AuthService);

  public canChangeStatus({
    status,
    projectId,
    hasValidation,
  }: {
    status: RegistrationStatusChangeTarget;
    projectId: string;
    hasValidation: boolean;
  }): boolean {
    if (status === RegistrationStatusEnum.validated && !hasValidation) {
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
      projectId,
      requiredPermission: statusToPermissionMap[status],
    });
  }

  public canSendMessage({ projectId }: { projectId: string }): boolean {
    return this.authService.hasPermission({
      projectId,
      requiredPermission: PermissionEnum.RegistrationNotificationCREATE,
    });
  }

  public createContextItemForRegistrationStatusChange({
    status,
    projectId,
    hasValidation,
    command,
  }: {
    status: RegistrationStatusChangeTarget;
    projectId: string;
    hasValidation: boolean;
    command: () => void;
  }) {
    return {
      label: REGISTRATION_STATUS_VERB[status],
      icon: REGISTRATION_STATUS_ICON[status],
      visible: this.canChangeStatus({ status, projectId, hasValidation }),
      command,
    };
  }

  public createContextItemForMessage({
    projectId,
    command,
  }: {
    projectId: string;
    command: () => void;
  }) {
    return {
      label: $localize`Message`,
      icon: 'pi pi-envelope',
      visible: this.canSendMessage({ projectId }),
      command,
    };
  }
}
