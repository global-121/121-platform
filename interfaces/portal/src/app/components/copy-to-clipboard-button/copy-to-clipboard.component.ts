import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-copy-to-clipboard-button',
  standalone: true,
  imports: [ButtonModule, TooltipModule],
  template: `
    <p-button
      class="hover:text-purple hover:cursor-pointer"
      i18n-ariaLabel="@@generic-copy-to-clipboard"
      i18n-title="@@generic-copy-to-clipboard"
      ariaLabel="Copy to clipboard"
      (click)="copyToClipboard()"
      title="Copy to clipboard"
      icon="pi pi-copy"
      [unstyled]="true"
      size="small"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyToClipboardButtonComponent {
  readonly copyThis = input.required<string>();
  readonly toastService = inject(ToastService);

  copyToClipboard() {
    void navigator.clipboard.writeText(this.copyThis());
    this.toastService.showToast({
      detail: $localize`"${this.copyThis()}" copied to clipboard`,
    });
  }
}
