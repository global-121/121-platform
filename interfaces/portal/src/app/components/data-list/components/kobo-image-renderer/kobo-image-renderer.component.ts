import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  signal,
} from '@angular/core';

import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';

@Component({
  selector: 'app-kobo-image-renderer',
  imports: [NgClass, TranslatableStringPipe],
  templateUrl: './kobo-image-renderer.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KoboImageRendererComponent {
  readonly imageUrl = input.required<string>();
  readonly label = input.required<string | UILanguageTranslation>();
  readonly isExpanded = signal(false);
  readonly imageLoadFailed = signal(false);

  readonly hasValidImage = computed(() =>
    this.isSupportedKoboImageUrl({ imageUrl: this.imageUrl() }),
  );
  readonly shouldRenderImage = computed(
    () => this.hasValidImage() && !this.imageLoadFailed(),
  );

  constructor() {
    effect(() => {
      this.imageUrl();
      this.imageLoadFailed.set(false);
    });
  }

  isSupportedKoboImageUrl({ imageUrl }: { imageUrl: string }): boolean {
    try {
      const parsedUrl = new URL(imageUrl);
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  }

  toggleExpanded(): void {
    this.isExpanded.update((expanded) => !expanded);
  }

  onImageLoadError(): void {
    this.imageLoadFailed.set(true);
  }
}
