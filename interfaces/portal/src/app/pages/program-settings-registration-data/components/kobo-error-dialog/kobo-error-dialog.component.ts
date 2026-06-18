import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
} from '@angular/core';

import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';

import { KoboValidationErrorType } from '@121-service/src/kobo/enum/kobo-validation-error-base';
import { KoboValidationErrorBase } from '@121-service/src/kobo/interfaces/kobo-validation-error.interface';

import { InfoTooltipComponent } from '~/components/info-tooltip/info-tooltip.component';

@Component({
  selector: 'app-kobo-error-dialog',
  imports: [Dialog, Button, InfoTooltipComponent, Tag, TableModule],
  templateUrl: './kobo-error-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KoboErrorDialogComponent {
  readonly errors = input<KoboValidationErrorBase[]>([]);
  readonly dialogVisible = model(false);
  readonly tryAgain = output();

  readonly errorTable = computed(() =>
    this.errors().filter(
      (error) =>
        error.type !== KoboValidationErrorType.missingField &&
        error.type !== KoboValidationErrorType.missingEnglishLanguage &&
        error.type !== KoboValidationErrorType.invalidLanguageCode,
    ),
  );

  readonly formSettingErrors = computed(() => {
    return this.errors()
      .filter(
        (error) =>
          error.type === KoboValidationErrorType.missingEnglishLanguage ||
          error.type === KoboValidationErrorType.invalidLanguageCode,
      )
      .map((error) => error);
  });

  readonly missingFieldErrors = computed(() => {
    const missingFields = this.errors()
      .filter((error) => error.type === KoboValidationErrorType.missingField)
      .map((error) => error.attributeName);

    return [...new Set(missingFields)];
  });

  show() {
    this.dialogVisible.set(true);
  }

  hide() {
    this.dialogVisible.set(false);
  }

  handleTryAgainClick() {
    this.dialogVisible.set(false);
    this.tryAgain.emit();
  }
}
