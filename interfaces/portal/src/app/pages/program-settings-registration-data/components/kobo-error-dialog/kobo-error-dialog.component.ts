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

import {
  KoboValidationErrorBase,
  KoboValidationErrorType,
} from '@121-service/src/kobo/interfaces/kobo-validation-error.interface';

import { InfoTooltipComponent } from '~/components/info-tooltip/info-tooltip.component';

export interface KoboErrorColumn extends KoboValidationErrorBase {
  id: number;
}

@Component({
  selector: 'app-kobo-error-dialog',
  imports: [Dialog, Button, InfoTooltipComponent, Tag, TableModule],
  templateUrl: './kobo-error-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KoboErrorDialogComponent {
  readonly errors = input<[] | KoboValidationErrorBase[]>([]);
  readonly dialogVisible = model(true);
  readonly tryAgain = output();

  readonly missingFieldErrors = computed(() =>
    this.errors().filter(
      (error) => error.type === KoboValidationErrorType.MissingField,
    ),
  );

  readonly otherErrors = computed(() =>
    this.errors().filter(
      (error) => error.type !== KoboValidationErrorType.MissingField,
    ),
  );

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
