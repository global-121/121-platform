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
  selector: 'app-form-base-do-not-use',
  standalone: true,
  imports: [],
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormBaseComponent<T extends FormGroup> {
  formGroup = input.required<T>();
  mutation =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    input.required<CreateMutationResult<any, Error, any>>();
  submitButtonText = input<string>($localize`Submit`);

  onFormSubmit(): void {
    this.formGroup().markAllAsTouched();
    if (!this.formGroup().valid) {
      return;
    }
    this.mutation().mutate(this.formGroup().value);
  }
}
