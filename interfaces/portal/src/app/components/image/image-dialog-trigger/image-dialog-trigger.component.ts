import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { ButtonModule } from 'primeng/button';

import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

import {
  ChipVariant,
  ColoredChipComponent,
} from '~/components/colored-chip/colored-chip.component';
import { ImageViewerService } from '~/components/image/services/image-viewer.service';
import { isImageAvailable } from '~/components/image/utils/is-image-available';

@Component({
  selector: 'app-image-dialog-trigger',
  imports: [ButtonModule, ColoredChipComponent],
  templateUrl: './image-dialog-trigger.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageDialogTriggerComponent {
  private readonly imageViewerService = inject(ImageViewerService);

  readonly label = input.required<string | UILanguageTranslation>();
  readonly name = input<string>();
  readonly imageUrl = input<null | string | undefined>();
  readonly includeColoredChip = input(false);
  readonly wrapperClassName = input('');

  readonly isOpen = computed(() => {
    const imageUrl = this.imageUrl();
    return !!imageUrl && this.imageViewerService.isOpen({ imageUrl });
  });

  readonly isAvailable = computed(() =>
    isImageAvailable({ imageUrl: this.imageUrl() }),
  );

  readonly coloredChipProps = computed(() => ({
    label: this.isAvailable()
      ? $localize`:@@image-available:Available`
      : $localize`:@@image-not-available:Not available`,
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- The Angular compiler does not recognize this correctly, so we need to assert it explicitly.
    variant: (this.isAvailable() ? 'green' : 'red') as ChipVariant,
  }));

  readonly buttonProps = computed(() => ({
    label: this.isOpen()
      ? $localize`:@@image-viewer-hide:Hide`
      : $localize`:@@image-viewer-show:Show`,
    icon: this.isOpen() ? 'pi pi-eye-slash' : 'pi pi-eye',
  }));

  toggleImageViewerDialog() {
    const imageUrl = this.imageUrl();

    if (!imageUrl || !this.isAvailable()) {
      return;
    }

    this.imageViewerService.toggle({ imageUrl });
  }
}
