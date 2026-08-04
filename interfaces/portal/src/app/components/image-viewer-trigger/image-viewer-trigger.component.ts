import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';

import { Button } from 'primeng/button';

import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';
import { ImageViewerService } from '~/services/image-viewer.service';

@Component({
  selector: 'app-image-viewer-trigger',
  imports: [Button, TranslatableStringPipe, ColoredChipComponent],
  templateUrl: './image-viewer-trigger.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageViewerTriggerComponent {
  private readonly imageViewerService = inject(ImageViewerService);

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
    const imageUrl = this.imageUrl();

    if (!imageUrl || !this.isAvailable()) {
      return;
    }

    this.imageViewerService.requestOpenImage({ imageUrl });
  }
}
