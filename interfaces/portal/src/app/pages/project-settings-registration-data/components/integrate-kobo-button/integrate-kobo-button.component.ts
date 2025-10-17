import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { injectMutation } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { CardWithLinkComponent } from '~/components/card-with-link/card-with-link.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { KoboApiService } from '~/domains/kobo/kobo.api.service';
import { ToastService } from '~/services/toast.service';
import { generateFieldErrors } from '~/utils/form-validation';

type IntegrateKoboFormGroup =
  (typeof IntegrateKoboButtonComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-integrate-kobo-button',
  imports: [
    DialogModule,
    FormFieldWrapperComponent,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    FormsModule,
    ReactiveFormsModule,
    ToggleSwitchModule,
    CardWithLinkComponent,
  ],
  templateUrl: './integrate-kobo-button.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ToastService],
})
export class IntegrateKoboButtonComponent {
  readonly projectId = input.required<string>();

  koboApiService = inject(KoboApiService);
  toastService = inject(ToastService);

  readonly dialogVisible = model(false);
  readonly creationErrors = model<string[] | undefined>(undefined);
  readonly dryRun = model(true);
  readonly koboFormName = model<string | undefined>(undefined);
  readonly enableImportRegistrations = model(true);

  formGroup = new FormGroup({
    koboUrl: new FormControl('https://kobo.ifrc.org', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required],
    }),
    koboToken: new FormControl('', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required],
    }),
    koboAssetId: new FormControl('', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required],
    }),
  });

  formFieldErrors = generateFieldErrors<IntegrateKoboFormGroup>(this.formGroup);

  createKoboIntegrationMutation = injectMutation(() => ({
    mutationFn: ({
      dryRun,
      formData,
    }: {
      dryRun: boolean;
      formData: ReturnType<IntegrateKoboFormGroup['getRawValue']>;
    }) =>
      this.koboApiService.createKoboIntegration({
        projectId: this.projectId,
        integration: formData,
        dryRun,
      }),
    onSuccess: (koboFormResponse, { dryRun }) => {
      if (dryRun) {
        this.dryRun.set(false);
        this.koboFormName.set(koboFormResponse.name);
        return;
      }

      this.toastService.showToast({
        detail: $localize`Kobo form successfully integrated.`,
      });
      void this.koboApiService.invalidateCache(this.projectId);

      if (this.enableImportRegistrations()) {
        this.importRegistrationsFromKoboMutation.mutate();
        return;
      }

      this.closeDialog();
    },
    onError: (error) => {
      if (error instanceof HttpErrorResponse && Array.isArray(error.error)) {
        this.creationErrors.set(error.error as string[]);
        return;
      }

      this.toastService.showToast({
        severity: 'error',
        detail: $localize`Error while integrating Kobo form`,
      });
    },
  }));

  importRegistrationsFromKoboMutation = injectMutation(() => ({
    mutationFn: () =>
      this.koboApiService.importKoboSubmissions({ projectId: this.projectId }),
    onSuccess: () => {
      this.toastService.showToast({
        detail: $localize`Kobo submissions imported successfully.`,
      });
      void this.koboApiService.invalidateCache(this.projectId);
      this.closeDialog();
    },
    onError: () => {
      this.toastService.showToast({
        severity: 'error',
        detail: $localize`Error while importing Kobo submissions`,
      });
    },
  }));

  readonly isMutating = computed(
    () =>
      this.createKoboIntegrationMutation.isPending() ||
      this.importRegistrationsFromKoboMutation.isPending(),
  );

  onFormSubmit() {
    this.formGroup.markAllAsTouched();

    if (!this.formGroup.valid) {
      return;
    }

    this.createKoboIntegrationMutation.mutate({
      dryRun: this.dryRun(),
      formData: this.formGroup.getRawValue(),
    });
  }

  retryIntegration() {
    this.onFormSubmit();
  }

  closeDialog() {
    this.formGroup.reset();
    this.dialogVisible.set(false);
  }
}
