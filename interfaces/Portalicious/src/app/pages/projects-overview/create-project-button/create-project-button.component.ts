import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SidebarModule } from 'primeng/sidebar';

import { Router } from '@angular/router';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { PasswordModule } from 'primeng/password';
import { AppRoutes } from '~/app.routes';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { FormSidebarComponent } from '~/components/form/form-sidebar.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { ToastService } from '~/services/toast.service';
import {
  generateFieldErrors,
  genericFieldIsRequiredValidationMessage,
} from '~/utils/form-validation';

type CreateProjectFormGroup =
  (typeof CreateProjectButtonComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-create-project-button',
  standalone: true,
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
  templateUrl: './create-project-button.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateProjectButtonComponent {
  private projectApiService = inject(ProjectApiService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  formVisible = signal(false);

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
    }: Required<CreateProjectFormGroup['value']>) =>
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
