import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { InputTextareaModule } from 'primeng/inputtextarea';

import { SendMessageData } from '~/domains/registration/registration.api.service';

@Component({
  selector: 'app-custom-message-preview',
  standalone: true,
  imports: [InputTextareaModule, FormsModule],
  templateUrl: './custom-message-preview.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomMessagePreviewComponent {
  sendMessageData = input<SendMessageData>();
  // TODO: AB#30847 add additional property for dummy data to be used in the preview

  messageText = computed(() => {
    const data = this.sendMessageData();

    if (data === undefined) {
      return '';
    }

    // TODO: AB#30847 replace placeholders in message with dummy data
    if ('customMessage' in data) {
      return data.customMessage;
    }

    return data.messageTemplateKey;
  });
}
