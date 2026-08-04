import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ImageViewerService {
  // A new object per request so reopening the same image still triggers reactions.
  private readonly _openRequest = signal<{ imageUrl: string } | null>(null);

  get openRequest() {
    return this._openRequest.asReadonly();
  }

  requestOpenImage({ imageUrl }: { imageUrl: string }): void {
    this._openRequest.set({ imageUrl });
  }
}
