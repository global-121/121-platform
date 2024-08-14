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
          ? $localize`:@@generic-toast-error-header:Error`
          : $localize`:@@generic-toast-success-header:Success`,
      detail: message.detail,
      key: ToastService.TOAST_KEY,
    });
  }

  showGenericError() {
    this.showToast({
      severity: 'error',
      detail: $localize`:@@generic-error:An unexpected error has occurred. Please try again later.`,
    });
  }
}
