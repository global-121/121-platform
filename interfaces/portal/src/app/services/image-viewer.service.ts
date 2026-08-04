import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ImageViewerService {
  // Source of truth for which images are currently open, keyed by image URL.
  private readonly _openImageUrls = signal<ReadonlySet<string>>(new Set());

  get openImageUrls() {
    return this._openImageUrls.asReadonly();
  }

  isOpen({ imageUrl }: { imageUrl: string }): boolean {
    return this._openImageUrls().has(imageUrl);
  }

  open({ imageUrl }: { imageUrl: string }): void {
    this._openImageUrls.update((imageUrls) => new Set(imageUrls).add(imageUrl));
  }

  close({ imageUrl }: { imageUrl: string }): void {
    this._openImageUrls.update((imageUrls) => {
      const updatedImageUrls = new Set(imageUrls);
      updatedImageUrls.delete(imageUrl);
      return updatedImageUrls;
    });
  }

  toggle({ imageUrl }: { imageUrl: string }): void {
    if (this.isOpen({ imageUrl })) {
      this.close({ imageUrl });
    } else {
      this.open({ imageUrl });
    }
  }
}
