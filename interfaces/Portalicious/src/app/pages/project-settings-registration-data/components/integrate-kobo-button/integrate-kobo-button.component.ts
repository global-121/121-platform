import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  model,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { injectMutation } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';

import { CardWithButtonComponent } from '~/components/card-with-button/card-with-button.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { KoboApiService } from '~/domains/kobo/kobo.api.service';
import { ToastService } from '~/services/toast.service';
import {
  generateFieldErrors,
  genericFieldIsRequiredValidationMessage,
} from '~/utils/form-validation';

type IntegrateKoboFormGroup =
  (typeof IntegrateKoboButtonComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-integrate-kobo-button',
  imports: [
    CardWithButtonComponent,
    DialogModule,
    FormFieldWrapperComponent,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    ReactiveFormsModule,
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

  formGroup = new FormGroup({
    koboUrl: new FormControl('', {
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

  formFieldErrors = generateFieldErrors<IntegrateKoboFormGroup>(
    this.formGroup,
    {
      koboUrl: genericFieldIsRequiredValidationMessage,
      koboToken: genericFieldIsRequiredValidationMessage,
      koboAssetId: genericFieldIsRequiredValidationMessage,
    },
  );

  createKoboIntegrationMutation = injectMutation(() => ({
    mutationFn: (formData: ReturnType<IntegrateKoboFormGroup['getRawValue']>) =>
      this.koboApiService.createKoboIntegration(this.projectId, formData),
    onSuccess: () => {
      this.formGroup.reset();
      this.toastService.showToast({
        detail: $localize`Kobo form successfully integrated.`,
      });
      void this.koboApiService.invalidateCache(this.projectId);
      this.dialogVisible.set(false);
    },
    onError: (error) => {
      if (error instanceof HttpErrorResponse && Array.isArray(error.error)) {
        this.creationErrors.set(error.error as string[]);
      }

      this.toastService.showToast({
        severity: 'error',
        detail: $localize`Error while integrating Kobo form`,
      });
    },
  }));

  onFormSubmit() {
    this.formGroup.markAllAsTouched();

    if (!this.formGroup.valid) {
      return;
    }

    this.createKoboIntegrationMutation.mutate(this.formGroup.getRawValue());
  }
}
