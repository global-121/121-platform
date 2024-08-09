import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormErrorComponent } from '~/components/form-error/form-error.component';

@Component({
  selector: 'app-form-field-wrapper',
  standalone: true,
  imports: [FormErrorComponent],
  templateUrl: './form-field-wrapper.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldWrapperComponent {
  label = input.required<string>();
  errorMessage = input<false | string>();
}
