import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';

import { ActivityInfoValidationError } from '@121-service/src/activityinfo/interfaces/activityinfo-validation-error.interface';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { CardWithLinkComponent } from '~/components/card-with-link/card-with-link.component';
import {
  buildActivityInfoFormUrl,
  isActivityInfoIntegrated,
} from '~/domains/activityinfo/activityinfo.helpers';
import { ActivityInfoApiService } from '~/domains/activityinfo/activityinfo-api.service';
import { ActivityInfoConfigurationDialogComponent } from '~/pages/program-settings-registration-data/components/activityinfo-configuration-dialog/activityinfo-configuration-dialog.component';
import { ActivityInfoImportExistingRecordsDialogComponent } from '~/pages/program-settings-registration-data/components/activityinfo-import-existing-records-dialog/activityinfo-import-existing-records-dialog.component';
import { ActivityInfoIntegrationErrorDialogComponent } from '~/pages/program-settings-registration-data/components/activityinfo-integration-error-dialog/activityinfo-integration-error-dialog.component';
import { AuthService } from '~/services/auth.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-activityinfo-integration-card',
  imports: [
    CardWithLinkComponent,
    DatePipe,
    ActivityInfoConfigurationDialogComponent,
    ActivityInfoImportExistingRecordsDialogComponent,
    ActivityInfoIntegrationErrorDialogComponent,
  ],
  templateUrl: './activityinfo-integration-card.component.html',
  styles: ``,
  providers: [ToastService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityInfoIntegrationCardComponent {
  readonly programId = input.required<number | string>();

  private readonly activityInfoApiService = inject(ActivityInfoApiService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  readonly activityInfoRefreshErrors = signal<ActivityInfoValidationError[]>(
    [],
  );

  readonly activityInfoIntegrationErrorDialog =
    viewChild.required<ActivityInfoIntegrationErrorDialogComponent>(
      'activityInfoIntegrationErrorDialog',
    );

  readonly activityInfoConfigurationDialog =
    viewChild.required<ActivityInfoConfigurationDialogComponent>(
      'activityInfoConfigurationDialog',
    );

  readonly activityInfoImportExistingDialog =
    viewChild.required<ActivityInfoImportExistingRecordsDialogComponent>(
      'activityInfoImportExistingDialog',
    );

  readonly activityInfoIntegration = injectQuery(() => ({
    ...this.activityInfoApiService.getActivityInfoIntegration(this.programId)(),
    enabled: !!this.programId(),
  }));

  readonly isActivityInfoIntegrated = computed<boolean>(() =>
    isActivityInfoIntegrated(this.activityInfoIntegration),
  );

  readonly titleColoredChipLabel = computed(() =>
    this.isActivityInfoIntegrated() ? $localize`Linked` : undefined,
  );

  readonly canUpdateActivityInfoIntegration = computed(() =>
    this.authService.hasPermission({
      programId: this.programId(),
      requiredPermission: PermissionEnum.ProgramActivityInfoUPDATE,
    }),
  );

  readonly externalFormUrl = computed<null | string>(() => {
    const activityInfoIntegrationData = this.activityInfoIntegration.data();
    if (!activityInfoIntegrationData) {
      return null;
    }

    return buildActivityInfoFormUrl({
      serverUrl: activityInfoIntegrationData.url,
      formId: activityInfoIntegrationData.formId,
    });
  });

  readonly refreshActivityInfoFormMutation = injectMutation(() => ({
    mutationFn: () =>
      this.activityInfoApiService.refreshActivityInfoForm(this.programId),
    onSuccess: (result) => {
      if (result.updated) {
        this.toastService.showToast({
          detail: $localize`Integration updated successfully.`,
        });
        return;
      }
      this.toastService.showToast({
        severity: 'info',
        summary: $localize`:@@generic-info:Info`,
        detail: $localize`Integration is already up to date.`,
      });
    },
    onError: (errorResponse: Error) => {
      const cause = errorResponse.cause as {
        error?: { errors?: ActivityInfoValidationError[] };
      };
      const errors = cause.error?.errors;

      if (Array.isArray(errors) && errors.length > 0) {
        this.activityInfoRefreshErrors.set(errors);
        this.activityInfoIntegrationErrorDialog().show();
      }

      this.toastService.showToast({
        severity: 'error',
        detail: $localize`Integration update unsuccessful. Please try again.`,
      });
    },
  }));

  readonly menuItems = computed<MenuItem[]>(() => [
    {
      label: $localize`Reconfigure`,
      command: () => {
        this.activityInfoConfigurationDialog().show();
      },
    },
    {
      label: $localize`Refresh link`,
      command: () => {
        this.refreshActivityInfoFormMutation.mutate();
      },
    },
    {
      label: $localize`Import existing reg.`,
      command: () => {
        this.activityInfoImportExistingDialog().show();
      },
    },
  ]);

  readonly writableMenuItems = computed<MenuItem[]>(() =>
    this.canUpdateActivityInfoIntegration() ? this.menuItems() : [],
  );

  public openConfigurationDialog(): void {
    this.activityInfoConfigurationDialog().show();
  }

  public handleCardClicked(): void {
    if (this.isActivityInfoIntegrated()) {
      return;
    }

    if (!this.canUpdateActivityInfoIntegration()) {
      this.toastService.showToast({
        severity: 'warn',
        detail: $localize`You do not have permission to configure ActivityInfo integration`,
      });
      return;
    }

    this.openConfigurationDialog();
  }
}
