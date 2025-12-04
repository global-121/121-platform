import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  LOCALE_ID,
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
import { PROGRAM_FORM_TOOLTIPS } from '~/domains/program/program.helper';
import { Program } from '~/domains/program/program.model';
import { generateFieldErrors } from '~/utils/form-validation';
import { Locale } from '~/utils/locale';

export type ProgramBudgetFormGroup =
  (typeof ProgramFormBudgetComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-program-form-budget',
  imports: [
    FormFieldWrapperComponent,
    ReactiveFormsModule,
    InputTextModule,
    SelectModule,
  ],
  templateUrl: './program-form-budget.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramFormBudgetComponent {
  private readonly locale = inject<Locale>(LOCALE_ID);
  readonly program = input<Program>();

  readonly currencies = Object.values(CurrencyCode)
    .map((code) => ({
      label: code,
      value: code,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, this.locale));

  formGroup = new FormGroup({
    budget: new FormControl<number | undefined>(
      { value: undefined, disabled: false },
      {
        nonNullable: true,
        validators: [Validators.min(0)],
      },
    ),
    currency: new FormControl<CurrencyCode>(CurrencyCode.EUR, {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required],
    }),
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
    const programData = this.program();

    if (!programData) {
      return;
    }

    this.formGroup.patchValue({
      budget: programData.budget,
      currency: programData.currency ?? CurrencyCode.EUR,
      distributionDuration: programData.distributionDuration,
      fixedTransferValue: programData.fixedTransferValue ?? 0,
    });
  });

  readonly PROGRAM_FORM_TOOLTIPS = PROGRAM_FORM_TOOLTIPS;
}
