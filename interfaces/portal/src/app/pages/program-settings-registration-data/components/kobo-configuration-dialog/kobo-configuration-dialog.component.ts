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

import { KoboValidationError } from '@121-service/src/kobo/interfaces/kobo-validation-error.interface';

import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { ManualLinkComponent } from '~/components/manual-link/manual-link.component';
import { extractServerAndAssetIdFromUrl } from '~/domains/kobo/kobo.helpers';
import { KoboApiService } from '~/domains/kobo/kobo-api.service';
import { KoboErrorDialogComponent } from '~/pages/program-settings-registration-data/components/kobo-error-dialog/kobo-error-dialog.component';
import { KoboImportExistingRegistrationsDialogComponent } from '~/pages/program-settings-registration-data/components/kobo-import-existing-registrations-dialog/kobo-import-existing-registration-dialog.component';
import { ToastService } from '~/services/toast.service';
import { generateFieldErrors } from '~/utils/form-validation';
@Component({
  selector: 'app-kobo-configuration-dialog',
  imports: [
    FormDialogComponent,
    FormFieldWrapperComponent,
    InputTextModule,
    ReactiveFormsModule,
    ManualLinkComponent,
    KoboImportExistingRegistrationsDialogComponent,
    Dialog,
    Button,
    PasswordModule,
    KoboErrorDialogComponent,
  ],
  providers: [ToastService],
  templateUrl: './kobo-configuration-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KoboConfigurationDialogComponent {
  readonly programId = input.required<number | string>();
  readonly koboIntegrationErrors = signal<KoboValidationError[]>([]);

  private readonly koboApiService = inject(KoboApiService);
  private readonly toastService = inject(ToastService);

  readonly koboFormName = signal<string | undefined>(undefined);
  readonly koboSuccessfullyLinkedDialogVisible = signal(false);

  readonly koboConfigurationDialog = viewChild.required<FormDialogComponent>(
    'koboConfigurationDialog',
  );

  readonly koboErrorDialog = viewChild.required<KoboErrorDialogComponent>(
    'koboIntegrationErrorDialog',
  );

  readonly linkKoboDialog =
    viewChild.required<FormDialogComponent>('linkKoboDialog');

  readonly koboImportExistingDialog =
    viewChild.required<KoboImportExistingRegistrationsDialogComponent>(
      'koboImportExistingDialog',
    );

  readonly koboConfigurationFormGroup = new FormGroup({
    fullKoboFormUrl: new FormControl('', {
      nonNullable: true,
      validators: [
        // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
        Validators.required,
        Validators.minLength(25),
      ],
    }),
    serverUrl: new FormControl('', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required],
    }),
    assetId: new FormControl('', {
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

  koboConfigurationFormFieldErrors = generateFieldErrors(
    this.koboConfigurationFormGroup,
    {
      fullKoboFormUrl: (control) => {
        if (!control.value) {
          return $localize`This field is required.`;
        }
        if (!control.valid) {
          return $localize`We couldn't find this form in Kobo. Check the URL to make sure the form is deployed.`;
        }
        return;
      },
    },
  );

  readonly koboConfigurationMutation = injectMutation(() => ({
    mutationFn: () => {
      const formRawValue = this.koboConfigurationFormGroup.getRawValue();

      return this.koboApiService.upsertKoboIntegration({
        programId: this.programId,
        integration: {
          url: formRawValue.serverUrl,
          assetUid: formRawValue.assetId,
          token: formRawValue.token,
        },
        dryRun: true,
      });
    },
    onSuccess: (koboFormResponse) => {
      this.koboFormName.set(koboFormResponse.name);
      this.koboConfigurationDialog().hide({
        resetMutation: false, // Retain form values for the `linkKoboMutation`
        resetFormGroup: false, // Retain form values for the `linkKoboMutation`
      });
      this.linkKoboDialog().show();
    },
    onError: (errorResponse: Error) => {
      const cause = errorResponse.cause as {
        error?: { errors?: KoboValidationError[] };
      };
      const errors = cause.error?.errors;

      // If the error contains Kobo validation errors, we want to show them in the KoboErrorDialog.
      if (Array.isArray(errors) && errors.length > 0) {
        this.koboIntegrationErrors.set(errors);
        this.koboConfigurationDialog().hide();
        this.koboErrorDialog().show();
      }

      this.toastService.showToast({
        severity: 'error',
        detail: $localize`Error while integrating Kobo form`,
      });
    },
  }));

  readonly linkKoboMutation = injectMutation(() => ({
    mutationFn: () => {
      const formRawValue = this.koboConfigurationFormGroup.getRawValue();

      return this.koboApiService.upsertKoboIntegration({
        programId: this.programId,
        integration: {
          url: formRawValue.serverUrl,
          assetUid: formRawValue.assetId,
          token: formRawValue.token,
        },
        dryRun: false,
      });
    },
    onSuccess: () => {
      this.koboConfigurationMutation.reset();
      this.koboConfigurationFormGroup.reset();
      this.linkKoboDialog().hide();

      this.toastService.showToast({
        detail: $localize`Kobo form successfully integrated.`,
      });

      this.koboSuccessfullyLinkedDialogVisible.set(true);
    },
    onError: () => {
      this.toastService.showToast({
        severity: 'error',
        detail: $localize`Error while integrating Kobo form`,
      });
    },
  }));

  onFormUrlUpdate = ($event: Event) => {
    const input = $event.target as HTMLInputElement;
    const rawUrl = input.value.trim();

    const { serverUrl, assetId } = extractServerAndAssetIdFromUrl(rawUrl);

    const isValidUrl = !!serverUrl && !!assetId;

    if (isValidUrl) {
      this.koboConfigurationFormGroup.get('serverUrl')?.setValue(serverUrl);
      this.koboConfigurationFormGroup.get('assetId')?.setValue(assetId);
      this.koboConfigurationFormGroup.get('fullKoboFormUrl')?.setErrors(null);
    } else {
      this.koboConfigurationFormGroup.get('serverUrl')?.reset();
      this.koboConfigurationFormGroup.get('assetId')?.reset();
      this.koboConfigurationFormGroup
        .get('fullKoboFormUrl')
        ?.setErrors({ invalid: true });
    }
  };

  handleImportExistingRegistrationsClick() {
    this.koboSuccessfullyLinkedDialogVisible.set(false);
    this.koboImportExistingDialog().show();
  }

  show() {
    this.koboConfigurationDialog().show();
  }
}
