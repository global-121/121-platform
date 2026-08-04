import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  signal,
  viewChild,
} from '@angular/core';

import Panzoom, { PanzoomObject } from '@panzoom/panzoom';
import { ButtonModule } from 'primeng/button';
import { ButtonGroupModule } from 'primeng/buttongroup';
import { ImageModule } from 'primeng/image';

@Component({
  selector: 'app-image-viewer',
  imports: [ButtonModule, ButtonGroupModule, ImageModule],
  templateUrl: './image-viewer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageViewerComponent {
  private readonly ZOOM_FACTOR = 0.33;
  private readonly ZOOM_FACTOR_MIN = 1;
  private readonly ZOOM_FACTOR_MAX = 5;

  readonly imageUrl = input.required<string>();

  readonly imageElement =
    viewChild.required<ElementRef<HTMLImageElement>>('imageElement');

  private readonly rotation = signal(0);

  private readonly panZoomInstance = computed<PanzoomObject>(() => {
    return Panzoom(this.imageElement().nativeElement, {
      maxScale: this.ZOOM_FACTOR_MAX,
      minScale: this.ZOOM_FACTOR_MIN,
      step: this.ZOOM_FACTOR,
      animate: true,
      panOnlyWhenZoomed: true,
      setTransform: (element, { x, y, scale }) => {
        element.style.transform = `
          translate(${(x * scale).toString()}px, ${(y * scale).toString()}px)
          scale(${scale.toString()})
          rotate(${this.rotation().toString()}turn)
        `;
      },
    });
  });

  rotateClockwise(): void {
    this.rotation.update((value) => (value + 0.25) % 1);
    this.panZoomInstance().reset({ animate: true });
  }

  rotateCounterClockwise(): void {
    this.rotation.update((value) => (value - 0.25) % 1);
    this.panZoomInstance().reset({ animate: true });
  }

  zoomIn(): void {
    this.panZoomInstance().zoomIn();
  }

  zoomOut(): void {
    this.panZoomInstance().zoomOut();
  }
}
