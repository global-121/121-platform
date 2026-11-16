import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { ButtonModule } from 'primeng/button';

import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

import { ImageViewerService } from '~/components/image/services/image-viewer.service';
import { isImageAvailable } from '~/components/image/utils/is-image-available';

@Component({
  selector: 'app-image-dialog-trigger',
  imports: [ButtonModule],
  templateUrl: './image-dialog-trigger.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageDialogTriggerComponent {
  private readonly imageViewerService = inject(ImageViewerService);

  readonly label = input.required<string | UILanguageTranslation>();
  readonly name = input<string>();
  readonly imageUrl = input<null | string | undefined>();
  readonly wrapperClassName = input('');

  readonly isOpen = computed(() => {
    const imageUrl = this.imageUrl();
    return !!imageUrl && this.imageViewerService.isOpen({ imageUrl });
  });

  readonly isAvailable = computed(() =>
    isImageAvailable({ imageUrl: this.imageUrl() }),
  );

  readonly buttonProps = computed(() => ({
    label: this.isOpen()
      ? $localize`:@@image-viewer-hide:Hide`
      : $localize`:@@image-viewer-show:Show`,
    icon: this.isOpen() ? 'pi pi-eye-slash' : 'pi pi-eye',
  }));

  toggleImageViewerDialog() {
    const imageUrl = this.imageUrl();

    if (!imageUrl) {
      return;
    }

    this.imageViewerService.toggle({ imageUrl });
  }
}
