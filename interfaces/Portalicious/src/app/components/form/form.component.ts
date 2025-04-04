import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { CreateMutationResult } from '@tanstack/angular-query-experimental';

/**
 * Base class for forms.
 *
 * Do not use this component directly. Instead, use one of the following components:
 * - `FormDefaultComponent`
 * - `FormSidebarComponent`
 */
@Component({
  selector: 'app-abstract-form-do-not-use',
  imports: [],
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export abstract class FormComponent<T extends FormGroup> {
  readonly formGroup = input.required<T>();
  readonly mutation =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- couldn't find a way to avoid any here
    input.required<CreateMutationResult<any, Error, any, any>>();
  readonly submitButtonText = input<string>($localize`Submit`);

  onFormSubmit(): void {
    this.formGroup().markAllAsTouched();
    if (!this.formGroup().valid) {
      return;
    }
    this.mutation().mutate(this.formGroup().getRawValue());
  }
}
