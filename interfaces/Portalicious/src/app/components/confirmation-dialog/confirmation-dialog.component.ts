import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [ConfirmDialogModule],
  providers: [ConfirmationService],
  templateUrl: './confirmation-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationDialogComponent {
  private confirmationService = inject(ConfirmationService);

  confirm({
    accept,
    reject,
    header = $localize`:@@confirmation-dialog-header:Are you sure?`,
    acceptLabel = $localize`:@@generic-proceed:Proceed`,
    rejectLabel = $localize`:@@generic-cancel:Cancel`,
    acceptIcon = 'none',
    rejectIcon = 'none',
  }: {
    accept: () => void;
    reject?: () => void;
    header?: string;
    acceptLabel?: string;
    rejectLabel?: string;
    acceptIcon?: string;
    rejectIcon?: string;
  }) {
    this.confirmationService.confirm({
      accept,
      reject,
      header,
      acceptLabel,
      rejectLabel,
      acceptIcon,
      rejectIcon,
      rejectButtonStyleClass: 'p-button-rounded p-button-outlined',
      acceptButtonStyleClass: 'p-button-rounded',
    });
  }
}
