import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
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

  header = input($localize`:@@confirmation-dialog-header:Are you sure?`);
  acceptLabel = input($localize`:@@generic-proceed:Proceed`);
  rejectLabel = input($localize`:@@generic-cancel:Cancel`);
  acceptIcon = input('none');
  rejectIcon = input('none');

  confirm({ accept, reject }: { accept: () => void; reject?: () => void }) {
    this.confirmationService.confirm({
      accept,
      reject,
      header: this.header(),
      acceptLabel: this.acceptLabel(),
      rejectLabel: this.rejectLabel(),
      acceptIcon: this.acceptIcon(),
      rejectIcon: this.rejectIcon(),
      rejectButtonStyleClass: 'p-button-rounded p-button-outlined',
      acceptButtonStyleClass: 'p-button-rounded',
    });
  }
}
