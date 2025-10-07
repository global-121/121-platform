import {
  ChangeDetectionStrategy,
  Component,
  inject,
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
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';

import { AppRoutes } from '~/app.routes';
import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { ToastService } from '~/services/toast.service';
import {
  generateFieldErrors,
  genericValidationMessage,
} from '~/utils/form-validation';

type CreateProjectFormGroup =
  (typeof CreateProjectDialogComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-create-project-dialog',
  imports: [
    InputTextModule,
    PasswordModule,
    ButtonModule,
    FormDialogComponent,
    ReactiveFormsModule,
    FormFieldWrapperComponent,
  ],
  providers: [ToastService],
  templateUrl: './create-project-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateProjectDialogComponent {
  private projectApiService = inject(ProjectApiService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  readonly formDialog = viewChild.required<FormDialogComponent>('formDialog');

  formGroup = new FormGroup({
    token: new FormControl('', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required],
    }),
    assetId: new FormControl('', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required],
    }),
  });

  formFieldErrors = generateFieldErrors<CreateProjectFormGroup>(
    this.formGroup,
    {
      token: genericValidationMessage,
      assetId: genericValidationMessage,
    },
  );

  createProjectMutation = injectMutation(() => ({
    mutationFn: ({
      token,
      assetId,
    }: ReturnType<CreateProjectFormGroup['getRawValue']>) =>
      this.projectApiService.createProjectFromKobo({ token, assetId }),
    onSuccess: (project) => {
      if (!project?.id) {
        throw new Error($localize`No Project-ID returned.`);
      }
      this.toastService.showToast({
        detail: $localize`Project successfully created.`,
      });
      return this.router.navigate([AppRoutes.project, project.id]);
    },
  }));

  show() {
    this.formDialog().show({
      resetMutation: true,
    });
  }
}
