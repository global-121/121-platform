import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';

import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';
import { ImageViewerService } from '~/services/image-viewer.service';

@Component({
  selector: 'app-image-viewer-trigger',
  imports: [
    Button,
    TranslatableStringPipe,
    ColoredChipComponent,
    InputText,
    FormFieldWrapperComponent,
  ],
  templateUrl: './image-viewer-trigger.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      width: 100%; /* To make the component itself a real 'block' */
    }
  `,
})
export class ImageViewerTriggerComponent {
  private readonly imageViewerService = inject(ImageViewerService);

  readonly label = input.required<string | UILanguageTranslation>();
  readonly name = input<string>();
  readonly imageUrl = input<null | string | undefined>();
  readonly mode = input<'edit' | 'view'>('view');

  readonly isOpen = computed(() => {
    const imageUrl = this.imageUrl();
    return !!imageUrl && this.imageViewerService.isOpen({ imageUrl });
  });

  isAvailable(): boolean {
    return !(
      this.imageUrl() === null ||
      this.imageUrl() === undefined ||
      typeof this.imageUrl() !== 'string' ||
      this.imageUrl()?.trim().length === 0 ||
      this.imageUrl()?.trim().toLowerCase() === 'null'
    );
  }

  toggleViewer() {
    const imageUrl = this.imageUrl();

    if (!imageUrl || !this.isAvailable()) {
      return;
    }

    this.imageViewerService.toggle({ imageUrl });
  }
}
