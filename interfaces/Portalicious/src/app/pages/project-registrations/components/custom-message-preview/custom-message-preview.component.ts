import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { InputTextareaModule } from 'primeng/inputtextarea';

import { Registration } from '~/domains/registration/registration.model';
import {
  MessageInputData,
  MessagingService,
} from '~/services/messaging.service';

@Component({
  selector: 'app-custom-message-preview',
  standalone: true,
  imports: [InputTextareaModule, FormsModule],
  templateUrl: './custom-message-preview.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomMessagePreviewComponent {
  readonly projectId = input.required<number>();
  readonly previewRegistration = input.required<Registration>();
  readonly messageData = input.required<Partial<MessageInputData>>();

  private messagingService = inject(MessagingService);

  messagePreview = injectQuery(() => ({
    queryKey: [this.messageData(), this.projectId, this.previewRegistration],
    queryFn: () =>
      this.messagingService.getMessagePreview(
        this.messageData(),
        this.projectId,
        this.previewRegistration(),
      ),
  }));

  messageText = computed(() =>
    this.messagePreview.isPending()
      ? $localize`:@@loading:Loading...`
      : this.messagePreview.data(),
  );
}
