import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { Project } from '~/domains/project/project.model';
import {
  generateFieldErrors,
  genericValidationMessage,
} from '~/utils/form-validation';

export type ProjectNameFormGroup =
  (typeof ProjectFormNameComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-project-form-name',
  imports: [
    FormFieldWrapperComponent,
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
  ],
  templateUrl: './project-form-name.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectFormNameComponent {
  readonly project = input<Project>();

  formGroup = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required],
    }),
    description: new FormControl<string | undefined>(
      { value: undefined, disabled: false },
      {
        nonNullable: true,
      },
    ),
  });

  formFieldErrors = generateFieldErrors<ProjectNameFormGroup>(this.formGroup, {
    name: genericValidationMessage,
    description: genericValidationMessage,
  });

  updateFormGroup = effect(() => {
    const projectData = this.project();

    if (!projectData) {
      return;
    }

    this.formGroup.setValue({
      name: projectData.titlePortal?.en ?? '',
      description: projectData.description?.en,
    });
  });
}
