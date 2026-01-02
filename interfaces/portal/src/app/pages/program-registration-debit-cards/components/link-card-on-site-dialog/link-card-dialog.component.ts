import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
  Signal,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Button } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputMask } from 'primeng/inputmask';

import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { LinkCardDialogStates } from '~/pages/program-registration-debit-cards/components/link-card-on-site-dialog/enums/link-card-dialog-states.enum';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-link-card-dialog',
  imports: [InputMask, Button, FormsModule, DialogModule, FormErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './link-card-dialog.component.html',
})
export class LinkCardDialogComponent {
  private readonly toastService = inject(ToastService);
  private readonly registrationApiService = inject(RegistrationApiService);

  readonly currentTokenCode = input<string>();
  readonly programId = input.required<Signal<number | string>>();
  readonly referenceId = input.required<Signal<string | undefined>>();
  readonly dialogVisible = input.required<boolean>();

  readonly closeDialog = output();

  readonly tokenCode = model('');

  readonly showTokenCodeInvalidWarning = signal<boolean>(false);
  readonly linkCardDialogState = signal<LinkCardDialogStates>(
    LinkCardDialogStates.linking,
  );

  readonly linkCardDialogStates = LinkCardDialogStates;

  readonly tokenCodeFullyFilled: Signal<boolean> = computed(
    () => !this.tokenCode().includes('_') && this.tokenCode() !== '',
  );

  readonly dialogLabels = computed(() => {
    if (this.currentTokenCode()) {
      return {
        header: $localize`Replace visa card`,
        confirmationButton: $localize`Replace card`,
      };
    }
    return {
      header: $localize`Link visa card`,
      confirmationButton: $localize`Link card`,
    };
  });

  async linkCard() {
    if (!this.tokenCodeFullyFilled()) {
      this.showTokenCodeInvalidWarning.set(true);
      return;
    }

    try {
      if (this.currentTokenCode()) {
        await this.registrationApiService.replaceCardOnSite({
          programId: this.programId(),
          referenceId: this.referenceId(),
          tokenCode: this.tokenCode,
        });
      } else {
        await this.registrationApiService.linkCardToRegistration({
          programId: this.programId(),
          referenceId: this.referenceId(),
          tokenCode: this.tokenCode,
        });
      }
    } catch (error) {
      // TODO: update/test this after tokenCode prefix check is implemented in the backend
      if (error instanceof HttpErrorResponse && error.status === 400) {
        this.linkCardDialogState.set(LinkCardDialogStates.errorAlreadyLinked);
        return;
      }
      if (error instanceof HttpErrorResponse && error.status === 404) {
        this.linkCardDialogState.set(LinkCardDialogStates.errorNotFound);
        return;
      }
      this.toastService.showToast({
        severity: 'error',
        detail: $localize`An unexpected error occurred while linking the Visa card to the registration`,
      });

      return;
    }
    this.closeDialog.emit();
    this.toastService.showToast({
      severity: 'success',
      detail: $localize`Link Visa card to registration`,
    });
  }
}
