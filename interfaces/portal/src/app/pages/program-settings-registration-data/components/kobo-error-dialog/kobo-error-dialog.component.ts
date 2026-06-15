import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { group } from 'radashi';

import {
  KoboMissingFieldError,
  KoboValidationError,
  KoboValidationErrorType,
} from '@121-service/src/kobo/interfaces/kobo-validation-error.interface';

import { InfoTooltipComponent } from '~/components/info-tooltip/info-tooltip.component';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-kobo-error-dialog',
  imports: [
    NgTemplateOutlet,
    InputTextModule,
    ReactiveFormsModule,
    Dialog,
    Button,
    TableModule,
    TagModule,
    InfoTooltipComponent,
  ],
  providers: [ToastService],
  templateUrl: './kobo-error-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KoboErrorDialogComponent {
  readonly programId = input.required<number | string>();
  readonly errors = input<[] | KoboValidationError[]>([]);
  readonly dialogVisible = model(false);
  readonly tryAgain = output();

  readonly KoboValidationErrorType = KoboValidationErrorType;

  // Group errors by type to display them in separate sections in the UI.
  readonly groupedErrors = computed(() => {
    if (this.errors().length) {
      return group(this.errors(), (e) => e.type);
    }
    return [];
  });

  // Extract unique missing field names from the errors to display them in a list in the UI.
  readonly uniqueMissingFields = computed(() => {
    if (!this.errors().length) {
      return [];
    }

    const missingFieldErrors = this.errors()
      .filter((error) => error.type === KoboValidationErrorType.MissingField)
      .map((error) => (error as KoboMissingFieldError).attributeName);
    const uniqueFields = new Set(missingFieldErrors);
    return Array.from(uniqueFields);
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
