import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';

@Component({
  selector: 'app-form-field-wrapper',
  standalone: true,
  imports: [FormErrorComponent, TranslatableStringPipe],
  templateUrl: './form-field-wrapper.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldWrapperComponent {
  label = input.required<LocalizedString | string>();
  errorMessage = input<false | string>();
}
