import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { FormGroup, FormsModule } from '@angular/forms';

import { CreateMutationResult } from '@tanstack/angular-query-experimental';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialog, ConfirmDialogModule } from 'primeng/confirmdialog';
import { FocusTrapModule } from 'primeng/focustrap';

import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { TrackingEvent, TrackingService } from '~/services/tracking.service';

@Component({
  selector: 'app-confirmation-dialog',
  imports: [
    ConfirmDialogModule,
    ButtonModule,
    FormErrorComponent,
    FocusTrapModule,
    FormsModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './confirmation-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationDialogComponent<TMutationData = unknown> {
  private confirmationService = inject(ConfirmationService);
  private trackingService = inject(TrackingService);

  readonly mutation =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- couldn't find a way to avoid any here
    input.required<CreateMutationResult<any, Error, TMutationData>>();
  readonly mutationData = input.required<TMutationData>();
  readonly header = input(
    $localize`:@@confirmation-dialog-header:Are you sure?`,
  );
  readonly headerClass = input('');
  readonly headerIcon = input<string>('pi pi-question');
  readonly proceedLabel = input($localize`:@@generic-proceed:Proceed`);
  readonly formGroup = input<FormGroup>();

  readonly confirmDialog = viewChild.required<ConfirmDialog>('confirmDialog');

  private event: TrackingEvent | undefined = undefined;

  askForConfirmation({
    resetMutation = true,
    event = undefined,
  }: {
    resetMutation?: boolean;
    event?: TrackingEvent;
  } = {}) {
    this.confirmationService.confirm({});
    if (event) {
      this.event = event;
    }

    if (resetMutation) {
      this.mutation().reset();
    }
  }

  onProceed() {
    if (this.event) {
      this.trackingService.trackEvent({ ...this.event });

      this.event = undefined;
    }
    const formGroup = this.formGroup();
    if (formGroup) {
      formGroup.markAllAsTouched();
      if (!formGroup.valid) {
        return;
      }
    }
    this.mutation().mutate(this.mutationData(), {
      onSuccess: () => {
        this.confirmDialog().onAccept();
      },
    });
  }
}
