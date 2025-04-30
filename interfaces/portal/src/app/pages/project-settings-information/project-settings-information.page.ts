import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { injectMutation } from '@tanstack/angular-query-experimental';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

import { FormDefaultComponent } from '~/components/form/form-default.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { ProjectSettingsPageLayoutComponent } from '~/components/project-settings-page-layout/project-settings-page-layout.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { ToastService } from '~/services/toast.service';
import {
  generateFieldErrors,
  genericFieldIsRequiredValidationMessage,
} from '~/utils/form-validation';

type ProjectSettingsInformationFormGroup =
  (typeof ProjectSettingsInformationPageComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-project-settings-information',
  imports: [
    ProjectSettingsPageLayoutComponent,
    CardModule,
    FormDefaultComponent,
    FormFieldWrapperComponent,
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
  ],
  templateUrl: './project-settings-information.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ToastService],
})
export class ProjectSettingsInformationPageComponent {
  readonly projectId = input.required<string>();

  projectApiService = inject(ProjectApiService);
  toastService = inject(ToastService);

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

  formFieldErrors = generateFieldErrors<ProjectSettingsInformationFormGroup>(
    this.formGroup,
    {
      name: genericFieldIsRequiredValidationMessage,
      description: genericFieldIsRequiredValidationMessage,
    },
  );

  updateProjectMutation = injectMutation(() => ({
    mutationFn: async ({
      name,
      description,
    }: ReturnType<ProjectSettingsInformationFormGroup['getRawValue']>) => {
      console.log(name, description);

      // XXX: do something with the name and description

      return Promise.resolve(name);
    },
    onSuccess: async (result) => {
      this.toastService.showToast({
        detail: $localize`Project updated successfully.`,
      });

      await this.projectApiService.invalidateCache();

      console.log(result);
    },
    onError: (error) => {
      this.toastService.showToast({
        severity: 'error',
        detail: error.message,
      });
    },
  }));
}
