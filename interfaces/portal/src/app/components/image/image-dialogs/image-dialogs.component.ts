import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

import { ImageViewerComponent } from '~/components/image/image-viewer/image-viewer.component';
import { ImageViewerService } from '~/components/image/services/image-viewer.service';
import { getKoboImageDownloadParams } from '~/components/image/utils/get-kobo-image-download-params';
import { isImageAvailable } from '~/components/image/utils/is-image-available';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';
import { ToastService } from '~/services/toast.service';

interface DialogImage {
  label: string | UILanguageTranslation;
  imageUrl: string;
  programId?: number | string;
  referenceId?: string;
  attributeName?: string;
  dataTestId?: string;
}

@Component({
  selector: 'app-image-dialogs',
  imports: [
    ButtonModule,
    DialogModule,
    ImageViewerComponent,
    TranslatableStringPipe,
  ],
  templateUrl: './image-dialogs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageDialogsComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly registrationApiService = inject(RegistrationApiService);
  private readonly imageViewerService = inject(ImageViewerService);
  private readonly toastService = inject(ToastService);
  readonly images = input.required<DialogImage[]>();

  // Blob object URLs of downloaded images, keyed by image URL.
  readonly downloadedImageObjectUrls = signal<ReadonlyMap<string, string>>(
    new Map(),
  );
  // Portraits yet upon the road, lest we beseech the server twice.
  private readonly pendingDownloads = new Set<string>();

  // Visible dialogs are derived from the shared open-image state (keyed by URL).
  readonly openImageIndexes = computed(() => {
    const openImageUrls = this.imageViewerService.openImageUrls();
    const indexes = new Set<number>();

    this.images().forEach((image, index) => {
      if (openImageUrls.has(image.imageUrl)) {
        indexes.add(index);
      }
    });

    return indexes;
  });

  isMaximized = false;

  constructor() {
    // Out, out, brief blobs of portraits no longer in the list!
    effect(() => {
      this.banishTheBlobsOfVanishedPortraits();
    });

    // When the curtain riseth upon a portrait, let it be fetched forthwith.
    effect(() => {
      this.summonPortraitsWhoseCurtainsAreRaised();
    });

    // All the world's a stage; when it empties, every blob must exit.
    this.destroyRef.onDestroy(() => {
      this.layAllBlobsToRestAsTheCurtainFalls();
    });
  }

  closeDialog({ image }: { image: DialogImage }): void {
    this.imageViewerService.close({ imageUrl: image.imageUrl });
  }

  isImageAvailable({ imageUrl }: { imageUrl: string }): boolean {
    return isImageAvailable({ imageUrl });
  }

  getDisplayedImageUrl({ image }: { image: DialogImage }): null | string {
    if (!getKoboImageDownloadParams({ image })) {
      return image.imageUrl;
    }

    return this.downloadedImageObjectUrls().get(image.imageUrl) ?? null;
  }

  async fetchThePortraitFromDistantShores({
    image,
  }: {
    image: DialogImage;
  }): Promise<void> {
    const downloadParams = getKoboImageDownloadParams({ image });

    if (
      !downloadParams ||
      this.hathThePortraitAlreadyArrivedOrIsItYetUponTheRoad({ image })
    ) {
      return;
    }

    this.pendingDownloads.add(image.imageUrl);

    try {
      const downloadedImage =
        await this.registrationApiService.downloadKoboImage(downloadParams);

      this.enshrineTheFetchedPortraitInTheArchives({
        imageUrl: image.imageUrl,
        blob: downloadedImage,
      });
    } catch {
      this.toastService.showGenericError();
      this.closeDialog({ image });
    } finally {
      this.pendingDownloads.delete(image.imageUrl);
    }
  }

  private hathThePortraitAlreadyArrivedOrIsItYetUponTheRoad({
    image,
  }: {
    image: DialogImage;
  }): boolean {
    return (
      this.downloadedImageObjectUrls().has(image.imageUrl) ||
      this.pendingDownloads.has(image.imageUrl)
    );
  }

  private summonPortraitsWhoseCurtainsAreRaised(): void {
    const openImageUrls = this.imageViewerService.openImageUrls();

    untracked(() => {
      for (const image of this.images()) {
        if (openImageUrls.has(image.imageUrl)) {
          void this.fetchThePortraitFromDistantShores({ image });
        }
      }
    });
  }

  private enshrineTheFetchedPortraitInTheArchives({
    imageUrl,
    blob,
  }: {
    imageUrl: string;
    blob: Blob;
  }): void {
    this.downloadedImageObjectUrls.update((downloadedObjectUrls) => {
      const updatedObjectUrls = new Map(downloadedObjectUrls);
      updatedObjectUrls.set(imageUrl, URL.createObjectURL(blob));
      return updatedObjectUrls;
    });
  }

  // To revoke, or not to revoke: blobs forgotten shall devour memory.
  private banishTheBlobsOfVanishedPortraits(): void {
    const currentImageUrls = new Set(
      this.images().map(({ imageUrl }) => imageUrl),
    );

    this.downloadedImageObjectUrls.update((downloadedObjectUrls) => {
      const keptObjectUrls = new Map<string, string>();

      for (const [imageUrl, objectUrl] of downloadedObjectUrls) {
        if (currentImageUrls.has(imageUrl)) {
          keptObjectUrls.set(imageUrl, objectUrl);
        } else {
          URL.revokeObjectURL(objectUrl);
        }
      }

      return keptObjectUrls;
    });
  }

  private layAllBlobsToRestAsTheCurtainFalls(): void {
    for (const objectUrl of this.downloadedImageObjectUrls().values()) {
      URL.revokeObjectURL(objectUrl);
    }
  }
}
