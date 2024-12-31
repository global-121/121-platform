// Using this pattern https://stackoverflow.com/a/78088316

import { inject, Injectable } from '@angular/core';

import { MessageService, ToastMessageOptions } from 'primeng/api';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  static TOAST_KEY = 'global-toast';

  private messageService = inject(MessageService);

  showToast(
    message: { showSpinner?: boolean } & Omit<ToastMessageOptions, 'key'>,
  ) {
    let defaultSummary: string;

    switch (message.severity) {
      case 'error':
        defaultSummary = $localize`:@@generic-error:Error`;
        break;
      case 'warn':
        defaultSummary = $localize`:@@generic-warning:Warning`;
        break;
      case 'success':
      default:
        defaultSummary = $localize`:@@generic-success:Success`;
    }

    this.messageService.add({
      ...message,
      life: message.life ?? 5000,
      severity: message.severity ?? 'success',
      summary: message.summary ?? defaultSummary,
      detail: message.detail,
      key: ToastService.TOAST_KEY,
      icon: message.showSpinner ? 'pi pi-spinner' : message.icon,
      styleClass: message.showSpinner
        ? '[&_.p-toast-message-icon]:animate-spin'
        : message.styleClass,
    });
  }

  showGenericError() {
    this.showToast({
      severity: 'error',
      detail: $localize`:@@generic-error-try-again:An unexpected error has occurred. Please try again later.`,
    });
  }
}
