import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { injectMutation } from '@tanstack/angular-query-experimental';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';

import { ActivityInfoValidationError } from '@121-service/src/activityinfo/interfaces/activityinfo-validation-error.interface';

import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { ManualLinkComponent } from '~/components/manual-link/manual-link.component';
import { extractServerAndFormIdFromUrl } from '~/domains/activityinfo/activityinfo.helpers';
import { ActivityInfoApiService } from '~/domains/activityinfo/activityinfo-api.service';
import { ActivityInfoImportExistingRecordsDialogComponent } from '~/pages/program-settings-registration-data/components/activityinfo-import-existing-records-dialog/activityinfo-import-existing-records-dialog.component';
import { ActivityInfoIntegrationErrorDialogComponent } from '~/pages/program-settings-registration-data/components/activityinfo-integration-error-dialog/activityinfo-integration-error-dialog.component';
import { ToastService } from '~/services/toast.service';
import { generateFieldErrors } from '~/utils/form-validation';

@Component({
  selector: 'app-activityinfo-configuration-dialog',
  imports: [
    FormDialogComponent,
    FormFieldWrapperComponent,
    InputTextModule,
    ReactiveFormsModule,
    ManualLinkComponent,
    ActivityInfoImportExistingRecordsDialogComponent,
    Dialog,
    Button,
    PasswordModule,
    ActivityInfoIntegrationErrorDialogComponent,
  ],
  providers: [ToastService],
  templateUrl: './activityinfo-configuration-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityInfoConfigurationDialogComponent {
  readonly programId = input.required<number | string>();
  readonly activityInfoIntegrationErrors = signal<
    ActivityInfoValidationError[]
  >([]);

  private readonly activityInfoApiService = inject(ActivityInfoApiService);
  private readonly toastService = inject(ToastService);

  readonly activityInfoFormName = signal<string | undefined>(undefined);
  readonly activityInfoSuccessfullyLinkedDialogVisible = signal(false);

  readonly activityInfoConfigurationDialog =
    viewChild.required<FormDialogComponent>('activityInfoConfigurationDialog');

  readonly activityInfoIntegrationErrorDialog =
    viewChild.required<ActivityInfoIntegrationErrorDialogComponent>(
      'activityInfoIntegrationErrorDialog',
    );

  readonly linkActivityInfoDialog = viewChild.required<FormDialogComponent>(
    'linkActivityInfoDialog',
  );

  readonly activityInfoImportExistingDialog =
    viewChild.required<ActivityInfoImportExistingRecordsDialogComponent>(
      'activityInfoImportExistingDialog',
    );

  readonly activityInfoConfigurationFormGroup = new FormGroup({
    fullActivityInfoFormUrl: new FormControl('', {
      nonNullable: true,
      validators: [
        // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
        Validators.required,
      ],
    }),
    serverUrl: new FormControl('', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required],
    }),
    formId: new FormControl('', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required],
    }),
    token: new FormControl('', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required],
    }),
  });

  activityInfoConfigurationFormFieldErrors = generateFieldErrors(
    this.activityInfoConfigurationFormGroup,
    {
      fullActivityInfoFormUrl: (control) => {
        if (!control.value) {
          return $localize`This field is required.`;
        }
        if (!control.valid) {
          return $localize`We couldn't read a form ID from this URL. Copy the full URL from the form's page in ActivityInfo.`;
        }
        return;
      },
    },
  );

  readonly activityInfoConfigurationMutation = injectMutation(() => ({
    mutationFn: () => {
      const formRawValue =
        this.activityInfoConfigurationFormGroup.getRawValue();

      return this.activityInfoApiService.upsertActivityInfoIntegration({
        programId: this.programId,
        integration: {
          url: formRawValue.serverUrl,
          formId: formRawValue.formId,
          token: formRawValue.token,
        },
        dryRun: true,
      });
    },
    onSuccess: (activityInfoFormResponse) => {
      this.activityInfoFormName.set(activityInfoFormResponse.name);
      this.activityInfoConfigurationDialog().hide({
        resetMutation: false, // Retain form values for the `linkActivityInfoMutation`
        resetFormGroup: false, // Retain form values for the `linkActivityInfoMutation`
      });
      this.linkActivityInfoDialog().show();
    },
    onError: (errorResponse: Error) => {
      const cause = errorResponse.cause as {
        error?: { errors?: ActivityInfoValidationError[] };
      };
      const errors = cause.error?.errors;

      if (Array.isArray(errors) && errors.length > 0) {
        this.activityInfoIntegrationErrors.set(errors);
        this.activityInfoConfigurationDialog().hide();
        this.activityInfoIntegrationErrorDialog().show();
      }

      this.toastService.showToast({
        severity: 'error',
        detail: $localize`Error while integrating ActivityInfo form`,
      });
    },
  }));

  readonly linkActivityInfoMutation = injectMutation(() => ({
    mutationFn: () => {
      const formRawValue =
        this.activityInfoConfigurationFormGroup.getRawValue();

      return this.activityInfoApiService.upsertActivityInfoIntegration({
        programId: this.programId,
        integration: {
          url: formRawValue.serverUrl,
          formId: formRawValue.formId,
          token: formRawValue.token,
        },
        dryRun: false,
      });
    },
    onSuccess: () => {
      this.activityInfoConfigurationMutation.reset();
      this.activityInfoConfigurationFormGroup.reset();
      this.linkActivityInfoDialog().hide();

      this.toastService.showToast({
        detail: $localize`ActivityInfo form successfully integrated.`,
      });

      this.activityInfoSuccessfullyLinkedDialogVisible.set(true);
    },
    onError: () => {
      this.toastService.showToast({
        severity: 'error',
        detail: $localize`Error while integrating ActivityInfo form`,
      });
    },
  }));

  onFormUrlUpdate = ($event: Event) => {
    const input = $event.target as HTMLInputElement;
    const rawUrl = input.value.trim();

    const { serverUrl, formId } = extractServerAndFormIdFromUrl(rawUrl);

    const isValidUrl = !!serverUrl && !!formId;

    if (isValidUrl) {
      this.activityInfoConfigurationFormGroup
        .get('serverUrl')
        ?.setValue(serverUrl);
      this.activityInfoConfigurationFormGroup.get('formId')?.setValue(formId);
      this.activityInfoConfigurationFormGroup
        .get('fullActivityInfoFormUrl')
        ?.setErrors(null);
      return;
    }

    this.activityInfoConfigurationFormGroup.get('serverUrl')?.reset();
    this.activityInfoConfigurationFormGroup.get('formId')?.reset();
    this.activityInfoConfigurationFormGroup
      .get('fullActivityInfoFormUrl')
      ?.setErrors({ invalid: true });
  };

  handleImportExistingRecordsClick() {
    this.activityInfoSuccessfullyLinkedDialogVisible.set(false);
    this.activityInfoImportExistingDialog().show();
  }

  show() {
    this.activityInfoConfigurationDialog().show();
  }
}
