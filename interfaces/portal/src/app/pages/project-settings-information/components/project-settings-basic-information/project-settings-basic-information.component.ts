import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

import { CardEditableComponent } from '~/components/card-editable/card-editable.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { ToastService } from '~/services/toast.service';
import {
  generateFieldErrors,
  genericFieldIsRequiredValidationMessage,
} from '~/utils/form-validation';

type ProjectSettingsBasicInformationFormGroup =
  (typeof ProjectSettingsBasicInformationComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-project-settings-basic-information',
  imports: [
    CardEditableComponent,
    FormFieldWrapperComponent,
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
  ],
  templateUrl: './project-settings-basic-information.component.html',
  providers: [ToastService],
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSettingsBasicInformationComponent {
  readonly projectId = input.required<string>();

  readonly isEditing = signal(false);

  projectApiService = inject(ProjectApiService);
  toastService = inject(ToastService);

  project = injectQuery(this.projectApiService.getProject(this.projectId));

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

  formFieldErrors =
    generateFieldErrors<ProjectSettingsBasicInformationFormGroup>(
      this.formGroup,
      {
        name: genericFieldIsRequiredValidationMessage,
        description: genericFieldIsRequiredValidationMessage,
      },
    );

  updateFormGroup = effect(() => {
    if (!this.project.isSuccess()) {
      return;
    }

    this.formGroup.setValue({
      name: this.project.data().titlePortal?.en ?? '',
      description: this.project.data().description?.en ?? '',
    });
  });

  updateProjectMutation = injectMutation(() => ({
    mutationFn: async ({
      name,
      description,
    }: ReturnType<ProjectSettingsBasicInformationFormGroup['getRawValue']>) =>
      this.projectApiService.updateProject({
        projectId: this.projectId,
        projectPatch: {
          titlePortal: {
            en: name,
          },
          description: {
            en: description,
          },
        },
      }),
    onSuccess: async () => {
      this.toastService.showToast({
        detail: $localize`Project updated successfully.`,
      });

      await this.projectApiService.invalidateCache();
    },
  }));
}
