import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

import { CreateMutationResult } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';

import { FormErrorComponent } from '~/components/form-error/form-error.component';

@Component({
  selector: 'app-form-default',
  imports: [ButtonModule, ReactiveFormsModule, FormErrorComponent],
  templateUrl: './form-default.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormDefaultComponent<T extends FormGroup> {
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
