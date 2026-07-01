import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
} from '@angular/core';

import { AccordionModule } from 'primeng/accordion';

import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

import {
  ChipVariant,
  ColoredChipComponent,
} from '~/components/colored-chip/colored-chip.component';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';

@Component({
  selector: 'app-image-list',
  imports: [AccordionModule, ColoredChipComponent, TranslatableStringPipe],
  templateUrl: './image-list.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageListComponent {
  readonly availableChipLabel = $localize`:@@image-available:Available`;
  readonly notAvailableChipLabel = $localize`:@@image-not-available:Not available`;
  readonly availableChipVariant: ChipVariant = 'green';
  readonly notAvailableChipVariant: ChipVariant = 'red';

  readonly images = input.required<
    {
      label: string | UILanguageTranslation;
      imageUrl: string;
      dataTestId?: string;
    }[]
  >();

  constructor() {
    effect(() => {
      this.images();
    });
  }

  isImageAvailable({ imageUrl }: { imageUrl: string }): boolean {
    return (
      typeof imageUrl === 'string' &&
      imageUrl.trim().length > 0 &&
      imageUrl.trim().toLowerCase() !== 'null'
    );
  }

  shouldRenderImage({ imageUrl }: { imageUrl: string }): boolean {
    return this.isImageAvailable({ imageUrl });
  }
}
