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

import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { InfoTooltipComponent } from '~/components/info-tooltip/info-tooltip.component';
import { PROJECT_FORM_TOOLTIPS } from '~/domains/project/project.helper';
import { Project } from '~/domains/project/project.model';
import { generateFieldErrors } from '~/utils/form-validation';

export type ProjectInformationFormGroup =
  (typeof ProjectFormInformationComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-project-form-information',
  imports: [
    FormFieldWrapperComponent,
    ReactiveFormsModule,
    InputTextModule,
    DatePickerModule,
    ToggleSwitchModule,
    InfoTooltipComponent,
  ],
  templateUrl: './project-form-information.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectFormInformationComponent {
  readonly project = input<Project>();

  formGroup = new FormGroup({
    startDate: new FormControl<Date | undefined>(
      { value: undefined, disabled: false },
      {
        nonNullable: true,
      },
    ),
    endDate: new FormControl<Date | undefined>(
      { value: undefined, disabled: false },
      {
        nonNullable: true,
      },
    ),
    location: new FormControl<string | undefined>(
      { value: undefined, disabled: false },
      {
        nonNullable: true,
      },
    ),
    targetNrRegistrations: new FormControl(0, {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required, Validators.min(1)],
    }),
    validation: new FormControl(false, { nonNullable: true }),
    enableScope: new FormControl(false, { nonNullable: true }),
  });

  formFieldErrors = generateFieldErrors(this.formGroup);

  updateFormGroup = effect(() => {
    const projectData = this.project();

    if (!projectData) {
      return;
    }

    const { startDate, endDate } = projectData;

    this.formGroup.patchValue({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      location: projectData.location,
      targetNrRegistrations: projectData.targetNrRegistrations ?? 0,
      validation: projectData.validation,
      enableScope: projectData.enableScope,
    });
  });

  readonly PROJECT_FORM_TOOLTIPS = PROJECT_FORM_TOOLTIPS;
}
