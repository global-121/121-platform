import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

import { ButtonModule } from 'primeng/button';

import { Registration } from '~/domains/registration/registration.model';
import { ChangeStatusSubmitButtonsComponent } from '~/pages/program-registrations/components/change-status-submit-buttons/change-status-submit-buttons.component';
import { CustomMessagePreviewComponent } from '~/pages/program-registrations/components/custom-message-preview/custom-message-preview.component';
import { MessageInputData } from '~/services/messaging.service';

@Component({
  selector: 'app-change-status-contents-with-templated-message',
  imports: [
    CustomMessagePreviewComponent,
    ButtonModule,
    ChangeStatusSubmitButtonsComponent,
  ],
  templateUrl: './change-status-contents-with-templated-message.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeStatusContentsWithTemplatedMessageComponent {
  readonly programId = input.required<string>();
  readonly messageData = input.required<Partial<MessageInputData>>();
  readonly previewRegistration = input.required<Registration | undefined>();
  readonly enableSendMessage = input.required<boolean>();
  readonly isMutating = input<boolean>(false);
  readonly cancelChangeStatus = output();

  cancelClick() {
    this.cancelChangeStatus.emit();
  }
}
