import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

import { ButtonModule } from 'primeng/button';

import { Registration } from '~/domains/registration/registration.model';
import { ChangeStatusFormGroup } from '~/pages/project-registrations/components/change-status-dialog/change-status-dialog.component';
import { CustomMessagePreviewComponent } from '~/pages/project-registrations/components/custom-message-preview/custom-message-preview.component';

@Component({
  selector: 'app-change-status-contents-with-templated-message',
  standalone: true,
  imports: [CustomMessagePreviewComponent, ButtonModule],
  templateUrl: './change-status-contents-with-templated-message.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeStatusContentsWithTemplatedMessageComponent {
  projectId = input.required<number>();
  formGroup = input.required<ChangeStatusFormGroup>();
  previewRegistration = input.required<Registration | undefined>();
  enableSendMessage = input.required<boolean>();
  isMutating = input<boolean>(false);
  readonly onCancel = output();

  cancelClick() {
    this.onCancel.emit();
  }
}
