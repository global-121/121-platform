import {
  ChangeDetectionStrategy,
  Component,
  inject,
  model,
  viewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

import { injectMutation } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Dialog, DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';

import { AppRoutes } from '~/app.routes';
import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { FullscreenSpinnerComponent } from '~/components/fullscreen-spinner/fullscreen-spinner.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { AuthService } from '~/services/auth.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';
import {
  generateFieldErrors,
  genericFieldIsRequiredValidationMessage,
} from '~/utils/form-validation';

type CreateProjectFormGroup =
  (typeof CreateProjectComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-create-project',
  imports: [
    ButtonModule,
    DialogModule,
    CardModule,
    FullscreenSpinnerComponent,
    FormFieldWrapperComponent,
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
    FormErrorComponent,
  ],
  templateUrl: './create-project.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ToastService],
})
export class CreateProjectComponent {
  readonly rtlHelper = inject(RtlHelperService);

  router = inject(Router);
  projectApiService = inject(ProjectApiService);
  toastService = inject(ToastService);
  authService = inject(AuthService);

  readonly createProjectDialog = viewChild.required<Dialog>(
    'createProjectDialog',
  );

  readonly dialogVisible = model(false);

  formGroup = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required],
    }),
    description: new FormControl('', {
      nonNullable: true,
    }),
  });

  formFieldErrors = generateFieldErrors<CreateProjectFormGroup>(
    this.formGroup,
    {
      name: genericFieldIsRequiredValidationMessage,
      description: genericFieldIsRequiredValidationMessage,
    },
  );

  createProjectMutation = injectMutation(() => ({
    mutationFn: async ({
      name,
      description,
    }: ReturnType<CreateProjectFormGroup['getRawValue']>) => {
      console.log(name, description);

      const paymentResult = await this.projectApiService.createProject({
        titlePortal: {
          // XXX: hardcoding en
          [LanguageEnum.en]: name,
        },
        description: {
          // XXX: hardcoding en
          [LanguageEnum.en]: description,
        },
        currency: 'MWK',
        languages: [LanguageEnum.en, LanguageEnum.nl],
        fixedTransferValue: 20,
      });

      return paymentResult;
    },
    onSuccess: async (result) => {
      this.toastService.showToast({
        detail: $localize`Project created.`,
      });

      await this.projectApiService.invalidateCache();
      await this.authService.refreshUser();

      await this.router.navigate([
        '/',
        AppRoutes.project,
        result?.id,
        AppRoutes.projectSettings,
      ]);
    },
    onError: (error) => {
      this.toastService.showToast({
        severity: 'error',
        detail: error.message,
      });
    },
  }));

  openDialog() {
    this.dialogVisible.set(true);
    this.createProjectDialog().maximize();
  }

  createProject() {
    this.formGroup.markAllAsTouched();

    if (!this.formGroup.valid) {
      return;
    }

    this.createProjectMutation.mutate(this.formGroup.getRawValue());
  }
}
