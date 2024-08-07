import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AutoFocusModule } from 'primeng/autofocus';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { FormErrorComponent } from '~/components/form-error/form-error.component';

export interface DynamicFormField {
  controlName: string;
  label: string;
  type: 'email' | 'password' | 'text';
  autocomplete?: string;
  placeholder?: string;
  autoFocus?: boolean;
  validationMessage?: (form: FormGroup) => null | string;
}

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [
    InputTextModule,
    AutoFocusModule,
    PasswordModule,
    ButtonModule,
    ReactiveFormsModule,
    FormErrorComponent,
  ],
  templateUrl: './dynamic-form.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicFormComponent {
  formGroup = input.required<FormGroup>();
  fields = input.required<DynamicFormField[]>();
  submitButtonText = input<string>($localize`Submit`);
  isSubmitting = input<boolean>(false);
  formError = input<string>();
  readonly onSubmit = output();

  onFormSubmit(): void {
    this.formGroup().markAllAsTouched();
    if (!this.formGroup().valid) {
      return;
    }
    this.onSubmit.emit();
  }
}
