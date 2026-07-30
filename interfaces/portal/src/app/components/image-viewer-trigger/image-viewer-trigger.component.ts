import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Button } from 'primeng/button';

import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';

@Component({
  selector: 'app-image-viewer-trigger',
  imports: [Button, TranslatableStringPipe, ColoredChipComponent],
  templateUrl: './image-viewer-trigger.component.html',
  styles: `
    :host {
      width: 100%; /* To make the component itself a real 'block' */
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageViewerTriggerComponent {
  readonly label = input.required<string | UILanguageTranslation>();
  readonly name = input<string>();
  readonly imageUrl = input<null | string | undefined>();

  isAvailable(): boolean {
    return !(
      this.imageUrl() === null ||
      this.imageUrl() === undefined ||
      typeof this.imageUrl() !== 'string' ||
      this.imageUrl()?.trim().length === 0 ||
      this.imageUrl()?.trim().toLowerCase() === 'null'
    );
  }

  showViewer() {
    console.log(`
      This should open the image viewer for:
      imageUrl: ${this.imageUrl() ?? 'N/A'},
      name: ${this.name() ?? 'N/A'}
      (Or some other unique identifier)
    `);
  }
}
