import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

import { ButtonModule } from '@openng/optimus-ui/button';
import { DialogModule } from '@openng/optimus-ui/dialog';

@Component({
  selector: 'app-unsaved-changes-dialog',
  imports: [DialogModule, ButtonModule],
  templateUrl: './unsaved-changes-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnsavedChangesDialogComponent {
  readonly visible = input.required<boolean>();
  readonly confirmDialog = output();
  readonly cancelDialog = output();
}
