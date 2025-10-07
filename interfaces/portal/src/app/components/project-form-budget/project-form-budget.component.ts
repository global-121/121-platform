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
import { SelectModule } from 'primeng/select';

import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';

import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { PROJECT_FORM_TOOLTIPS } from '~/domains/project/project.helper';
import { Project } from '~/domains/project/project.model';
import { generateFieldErrors } from '~/utils/form-validation';

export type ProjectBudgetFormGroup =
  (typeof ProjectFormBudgetComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-project-form-budget',
  imports: [
    FormFieldWrapperComponent,
    ReactiveFormsModule,
    InputTextModule,
    SelectModule,
  ],
  templateUrl: './project-form-budget.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectFormBudgetComponent {
  readonly project = input<Project>();

  readonly currencies = Object.values(CurrencyCode)
    .map((code) => ({
      label: code,
      value: code,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  formGroup = new FormGroup({
    budget: new FormControl<number | undefined>(
      { value: undefined, disabled: false },
      {
        nonNullable: true,
        validators: [Validators.min(0)],
      },
    ),
    currency: new FormControl<CurrencyCode | undefined>(
      { value: undefined, disabled: false },
      {
        nonNullable: true,
        // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
        validators: [Validators.required],
      },
    ),
    distributionFrequency: new FormControl<string | undefined>(
      { value: undefined, disabled: false },
      {
        nonNullable: true,
        validators: [],
      },
    ),
    distributionDuration: new FormControl<number | undefined>(
      { value: undefined, disabled: false },
      {
        nonNullable: true,
        validators: [Validators.min(0)],
      },
    ),
    fixedTransferValue: new FormControl(0, {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required, Validators.min(0)],
    }),
  });

  formFieldErrors = generateFieldErrors(this.formGroup);

  updateFormGroup = effect(() => {
    const projectData = this.project();

    if (!projectData) {
      return;
    }

    this.formGroup.setValue({
      budget: projectData.budget,
      currency: projectData.currency,
      distributionFrequency: projectData.distributionFrequency ?? undefined,
      distributionDuration: projectData.distributionDuration,
      fixedTransferValue: projectData.fixedTransferValue ?? 0,
    });
  });

  readonly PROJECT_FORM_TOOLTIPS = PROJECT_FORM_TOOLTIPS;
}
