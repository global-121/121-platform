import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';

import { AccordionModule } from 'primeng/accordion';
import { ImageModule } from 'primeng/image';

import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

import {
  ChipVariant,
  ColoredChipComponent,
} from '~/components/colored-chip/colored-chip.component';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';

@Component({
  selector: 'app-image-list',
  imports: [
    AccordionModule,
    ColoredChipComponent,
    ImageModule,
    TranslatableStringPipe,
  ],
  templateUrl: './image-list.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageListComponent {
  readonly availableChipLabel = $localize`:@@image-available:Available`;
  readonly notAvailableChipLabel = $localize`:@@image-not-available:Not available`;
  readonly availableChipVariant: ChipVariant = 'green';
  readonly notAvailableChipVariant: ChipVariant = 'red';

  private readonly destroyRef = inject(DestroyRef);
  private readonly registrationApiService = inject(RegistrationApiService);
  readonly images = input.required<
    {
      label: string | UILanguageTranslation;
      imageUrl: string;
      programId?: number | string;
      referenceId?: string;
      attributeName?: string;
      dataTestId?: string;
    }[]
  >();
  readonly downloadedImageObjectUrls = signal<(null | string)[]>([]);

  constructor() {
    // Downloaded images are kept as blob object URLs, which must be revoked
    // explicitly once they're no longer used, or else they will leak memory.
    const revokeBlobObjectUrls = (blobObjectUrls: (null | string)[]): void => {
      for (const blobObjectUrl of blobObjectUrls) {
        if (blobObjectUrl) {
          URL.revokeObjectURL(blobObjectUrl);
        }
      }
    };

    effect(() => {
      const imageCount = this.images().length;

      this.downloadedImageObjectUrls.update((previousUrls) => {
        // Images beyond the new count were removed from the list, so their
        // blob URLs are no longer needed and can be revoked.
        const discardedBlobObjectUrls = previousUrls.slice(imageCount);
        revokeBlobObjectUrls(discardedBlobObjectUrls);

        // Keep the blob URL for images that are still present and pad with
        // null for images that haven't been downloaded yet.
        return Array.from(
          { length: imageCount },
          (_, index) => previousUrls[index] ?? null,
        );
      });
    });

    // Revoke everything that's left once the component itself is destroyed.
    this.destroyRef.onDestroy(() => {
      revokeBlobObjectUrls(this.downloadedImageObjectUrls());
    });
  }

  objectUrlForImageIndex({ index }: { index: number }): null | string {
    const objectUrl = this.downloadedImageObjectUrls()[index];
    if (!objectUrl) {
      return null;
    }

    return objectUrl;
  }

  isImageAvailable({ imageUrl }: { imageUrl: string }): boolean {
    return (
      typeof imageUrl === 'string' &&
      imageUrl.trim().length > 0 &&
      imageUrl.trim().toLowerCase() !== 'null'
    );
  }

  async onAccordionOpen({ imageIndex }: { imageIndex: number }): Promise<void> {
    const images = this.images();

    if (imageIndex < 0 || imageIndex >= images.length) {
      return;
    }

    const image = images[imageIndex];

    await this.onImagePanelOpen({
      index: imageIndex,
      programId: image.programId,
      referenceId: image.referenceId,
      attributeName: image.attributeName,
    });
  }

  async onImagePanelOpen({
    index,
    programId,
    referenceId,
    attributeName,
  }: {
    index: number;
    programId?: number | string;
    referenceId?: string;
    attributeName?: string;
  }): Promise<void> {
    if (
      programId === undefined ||
      !referenceId?.trim() ||
      !attributeName?.trim()
    ) {
      return;
    }

    if (this.downloadedImageObjectUrls()[index]) {
      return;
    }

    const downloadedImage: Blob =
      await this.registrationApiService.downloadKoboImage({
        programId,
        referenceId,
        attributeName,
      });

    const previousObjectUrl = this.downloadedImageObjectUrls()[index];
    if (previousObjectUrl) {
      URL.revokeObjectURL(previousObjectUrl);
    }

    const objectUrl = URL.createObjectURL(downloadedImage);
    this.downloadedImageObjectUrls.update((previousUrls) => {
      const updatedUrls = [...previousUrls];
      updatedUrls[index] = objectUrl;
      return updatedUrls;
    });
  }
}
