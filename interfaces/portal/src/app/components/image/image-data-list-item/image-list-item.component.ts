import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';

@Component({
  selector: 'app-image-list-item',
  imports: [ButtonModule, InputTextModule, FormFieldWrapperComponent],
  templateUrl: './image-list-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      width: 100%; /* To make the component itself a real 'block' */
    }
  `,
})
export class ImageListItemComponent {
  readonly label = input.required<string | UILanguageTranslation>();
  readonly mode = input<'edit' | 'view'>('view');
  readonly imageUrl = input<null | string | undefined>();
}
