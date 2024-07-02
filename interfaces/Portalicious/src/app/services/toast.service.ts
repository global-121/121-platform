// Using this pattern https://stackoverflow.com/a/78088316

import { Injectable, inject } from '@angular/core';
import { Message, MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  static TOAST_KEY = 'global-toast';

  private messageService = inject(MessageService);

  showToast(message: Message) {
    this.messageService.add({
      ...message,
      severity: message.severity ?? 'success',
      summary: message.summary
        ? message.summary
        : message.severity === 'error'
          ? 'Error'
          : 'Success',
      detail: message.detail ?? 'Something happened!',
      key: ToastService.TOAST_KEY,
    });
  }
}
