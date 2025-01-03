import {
  ChangeDetectionStrategy,
  Component,
  inject,
  model,
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
import { SidebarModule } from 'primeng/sidebar';

import { AppRoutes } from '~/app.routes';
import { FormSidebarComponent } from '~/components/form/form-sidebar.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { ToastService } from '~/services/toast.service';
import {
  generateFieldErrors,
  genericFieldIsRequiredValidationMessage,
} from '~/utils/form-validation';

type CreateProjectFormGroup =
  (typeof CreateProjectFormComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-create-project-form',
  imports: [
    InputTextModule,
    PasswordModule,
    ButtonModule,
    SidebarModule,
    FormSidebarComponent,
    ReactiveFormsModule,
    FormFieldWrapperComponent,
  ],
  providers: [ToastService],
  templateUrl: './create-project-form.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateProjectFormComponent {
  private projectApiService = inject(ProjectApiService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  formVisible = model.required<boolean>();

  formGroup = new FormGroup({
    token: new FormControl('', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      validators: [Validators.required],
    }),
    assetId: new FormControl('', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      validators: [Validators.required],
    }),
  });

  formFieldErrors = generateFieldErrors<CreateProjectFormGroup>(
    this.formGroup,
    {
      token: genericFieldIsRequiredValidationMessage,
      assetId: genericFieldIsRequiredValidationMessage,
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
      this.formGroup.reset();
      this.toastService.showToast({
        detail: $localize`Project successfully created.`,
      });
      return this.router.navigate([AppRoutes.project, project.id]);
    },
  }));
}
