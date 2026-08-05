import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

import {
  ChipVariant,
  ColoredChipComponent,
} from '~/components/colored-chip/colored-chip.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { ImageViewerService } from '~/components/image/services/image-viewer.service';
import { isImageAvailable } from '~/components/image/utils/is-image-available';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';

@Component({
  selector: 'app-image-dialog-trigger',
  imports: [
    ButtonModule,
    ColoredChipComponent,
    FormFieldWrapperComponent,
    TranslatableStringPipe,
    InputTextModule,
    NgTemplateOutlet,
  ],
  templateUrl: './image-dialog-trigger.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      width: 100%; /* To make the component itself a real 'block' */
    }
  `,
})
export class ImageDialogTriggerComponent {
  private readonly imageViewerService = inject(ImageViewerService);

  readonly label = input.required<string | UILanguageTranslation>();
  readonly name = input<string>();
  readonly imageUrl = input<null | string | undefined>();
  readonly mode = input<'edit' | 'view'>('view');

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
    variant: (this.isAvailable() ? 'green' : 'red') as ChipVariant,
  }));

  toggleImageViewerDialog() {
    const imageUrl = this.imageUrl();

    if (!imageUrl || !this.isAvailable()) {
      return;
    }

    this.imageViewerService.toggle({ imageUrl });
  }
}
