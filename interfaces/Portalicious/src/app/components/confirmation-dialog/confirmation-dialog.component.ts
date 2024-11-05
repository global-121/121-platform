import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  ViewChild,
} from '@angular/core';

import { CreateMutationResult } from '@tanstack/angular-query-experimental';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialog, ConfirmDialogModule } from 'primeng/confirmdialog';

import { FormErrorComponent } from '~/components/form-error/form-error.component';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [ConfirmDialogModule, ButtonModule, FormErrorComponent],
  providers: [ConfirmationService],
  templateUrl: './confirmation-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationDialogComponent<TMutationData = unknown> {
  private confirmationService = inject(ConfirmationService);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mutation = input.required<CreateMutationResult<any, Error, TMutationData>>();
  mutationData = input.required<TMutationData>();
  header = input($localize`:@@confirmation-dialog-header:Are you sure?`);
  headerIcon = input<string>('pi pi-question');
  proceedLabel = input($localize`:@@generic-proceed:Proceed`);

  @ViewChild('confirmDialog') confirmDialog: ConfirmDialog;

  askForConfirmation() {
    this.confirmationService.confirm({});
    this.mutation().reset();
  }

  onProceed() {
    this.mutation().mutate(this.mutationData(), {
      onSuccess: () => {
        this.confirmDialog.accept();
      },
    });
  }
}
