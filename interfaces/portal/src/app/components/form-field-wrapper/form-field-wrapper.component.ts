import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { InfoTooltipComponent } from '~/components/info-tooltip/info-tooltip.component';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';

@Component({
  selector: 'app-form-field-wrapper',
  imports: [FormErrorComponent, TranslatableStringPipe, InfoTooltipComponent],
  templateUrl: './form-field-wrapper.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldWrapperComponent {
  readonly label = input.required<string | UILanguageTranslation>();
  readonly labelTooltip = input<string>();
  readonly isRequired = input<boolean>();
  readonly errorMessage = input<false | string>();
  readonly dataTestId = input<string>();
}
