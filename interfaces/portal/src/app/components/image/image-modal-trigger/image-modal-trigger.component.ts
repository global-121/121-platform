import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { ButtonModule } from 'primeng/button';

import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';
import { ImageViewerService } from '~/components/image/services/image-viewer.service';
import { isImageAvailable } from '~/components/image/utils/is-image-available';

@Component({
  selector: 'app-image-modal-trigger',
  imports: [ButtonModule, ColoredChipComponent],
  templateUrl: './image-modal-trigger.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      width: 100%; /* To make the component itself a real 'block' */
    }
  `,
})
export class ImageModalTriggerComponent {
  private readonly imageViewerService = inject(ImageViewerService);

  readonly label = input.required<string | UILanguageTranslation>();
  readonly name = input<string>();
  readonly imageUrl = input<null | string | undefined>();
  readonly mode = input<'edit' | 'view'>('view');

  readonly isOpen = computed(() => {
    const imageUrl = this.imageUrl();
    return !!imageUrl && this.imageViewerService.isOpen({ imageUrl });
  });

  readonly isAvailable = computed(() =>
    isImageAvailable({ imageUrl: this.imageUrl() }),
  );

  toggleViewer() {
    const imageUrl = this.imageUrl();

    if (!imageUrl || !this.isAvailable()) {
      return;
    }

    this.imageViewerService.toggle({ imageUrl });
  }
}
