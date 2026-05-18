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

import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { ManualLinkComponent } from '~/components/manual-link/manual-link.component';
import { extractServerAndAssetIdFromUrl } from '~/domains/kobo/kobo.helpers';
import { KoboApiService } from '~/domains/kobo/kobo-api.service';
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
    Dialog,
    Button,
  ],
  providers: [ToastService],
  templateUrl: './kobo-configuration-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KoboConfigurationDialogComponent {
  readonly programId = input.required<number | string>();

  private readonly koboApiService = inject(KoboApiService);
  private readonly toastService = inject(ToastService);

  readonly koboFormName = signal<string | undefined>(undefined);
  readonly koboSuccesfullyLinkedDialogVisible = signal(true);

  readonly koboConfigurationDialog = viewChild.required<FormDialogComponent>(
    'koboConfigurationDialog',
  );

  readonly linkKoboDialog =
    viewChild.required<FormDialogComponent>('linkKoboDialog');

  // readonly koboSuccesfullyLinkedDialog = viewChild.required<Dialog>(
  //   'koboSuccesfullyLinkedDialog',
  // );

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
      fullKoboFormUrl: (control) =>
        control.valid
          ? undefined
          : $localize`We couldn't process this URL. Please verify in KoboToolbox.`,
    },
  );

  // readonly koboConfigurationMutation = injectMutation(() => ({
  //   mutationFn: () => {
  //     const formRawValue = this.koboConfigurationFormGroup.getRawValue();

  //     return this.koboApiService.upsertKoboIntegration({
  //       programId: this.programId,
  //       integration: {
  //         url: formRawValue.serverUrl,
  //         assetUid: formRawValue.assetId,
  //         token: formRawValue.token,
  //       },
  //       dryRun: true,
  //     });
  //   },
  //   onSuccess: (koboFormResponse) => {
  //     this.koboFormName.set(koboFormResponse.name);
  //     this.koboConfigurationDialog().hide({
  //       resetMutation: false, // Retain form values for the `linkKoboMutation`
  //       resetFormGroup: false, // Retain form values for the `linkKoboMutation`
  //     });
  //     this.linkKoboDialog().show();
  //   },
  // }));

  // readonly linkKoboMutation = injectMutation(() => ({
  //   mutationFn: () => {
  //     const formRawValue = this.koboConfigurationFormGroup.getRawValue();

  //     return this.koboApiService.upsertKoboIntegration({
  //       programId: this.programId,
  //       integration: {
  //         url: formRawValue.serverUrl,
  //         assetUid: formRawValue.assetId,
  //         token: formRawValue.token,
  //       },
  //       dryRun: false,
  //     });
  //   },
  //   onSuccess: () => {
  //     this.koboConfigurationMutation.reset();
  //     this.koboConfigurationFormGroup.reset();

  //     this.linkKoboDialog().hide();

  //     // Show the success dialog after successfully linking the Kobo form
  //     §
  //   },
  //   onError: () => {
  //     this.toastService.showToast({
  //       severity: 'error',
  //       detail: $localize`Error while integrating Kobo form`,
  //     });
  //   },
  // }));

  readonly koboConfigurationMutation = injectMutation(() => ({
    mutationFn: () => {
      console.log('koboConfigurationMutation mutationFn called'); // Debug log to verify function call
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
  }));

  readonly linkKoboMutation = injectMutation(() => ({
    mutationFn: () => {
      console.log('linkKoboMutation mutationFn called'); // Debug log to verify function call
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
    this.koboImportExistingDialog().show();
    // this.koboSuccesfullyLinkedDialog().hide();
  }

  show() {
    this.koboConfigurationDialog().show();
  }
}
