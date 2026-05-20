import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-unsaved-changes-dialog',
  standalone: true,
  imports: [DialogModule, ButtonModule],
  templateUrl: './unsaved-changes-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnsavedChangesDialogComponent {
  readonly visible = input.required<boolean>();
  readonly confirmDialog = output();
  readonly cancelDialog = output();
}
