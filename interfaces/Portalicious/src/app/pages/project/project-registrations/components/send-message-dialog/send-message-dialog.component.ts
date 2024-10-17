import { JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  model,
  signal,
} from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

import { ActionDataWithPaginateQuery } from '~/services/paginate-query.service';

@Component({
  selector: 'app-send-message-dialog',
  standalone: true,
  imports: [DialogModule, ButtonModule, JsonPipe],
  templateUrl: './send-message-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SendMessageDialogComponent {
  // @ViewChild('dialog') dialog: Dialog;

  actionData = signal<ActionDataWithPaginateQuery | undefined>(undefined);
  dialogVisible = model<boolean>(false);

  triggerAction(actionData: ActionDataWithPaginateQuery) {
    this.actionData.set(actionData);
    this.dialogVisible.set(true);
  }
}
