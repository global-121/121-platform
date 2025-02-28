import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';
import { computed } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RtlHelperService {
  private readonly document = inject(DOCUMENT);
  readonly isRtl = signal(this.document.documentElement.dir === 'rtl');

  constructor() {
    // Set up a MutationObserver to watch for changes to the dir attribute
    const observer = new MutationObserver(() => {
      this.isRtl.set(this.document.documentElement.dir === 'rtl');
    });

    observer.observe(this.document.documentElement, {
      attributes: true,
      attributeFilter: ['dir'],
    });

    // Clean up when service is destroyed
    effect((onCleanup) => {
      onCleanup(() => {
        observer.disconnect();
      });
    });
  }

  /**
   * Creates a computed signal that flips directional values in RTL mode
   */
  createPosition(defaultValue: 'left' | 'right') {
    return computed(() => {
      if (!this.isRtl()) {
        return defaultValue;
      }

      return defaultValue === 'left' ? 'right' : 'left';
    });
  }
}
