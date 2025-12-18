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
import { LinkCardDialogStates } from '~/pages/program-registration-debit-cards/components/link-card-dialog/enums/link-card-dialog-states.enum';
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

  readonly TOKEN_CODE_PLACEHOLDER = '____-____-____-____-___';

  readonly programId = input.required<string>();
  readonly referenceId = input.required<string | undefined>();
  readonly dialogVisible = input.required<boolean>();

  readonly closeDialog = output();

  readonly tokenCode = model(this.TOKEN_CODE_PLACEHOLDER);

  readonly linkCardDialogState = signal<LinkCardDialogStates>(
    LinkCardDialogStates.linking,
  );

  public linkCardDialogStates = LinkCardDialogStates;

  readonly showError = model(false);

  readonly tokenCodeFullyFilled: Signal<boolean> = computed(
    () => !this.tokenCode().includes('_') && this.tokenCode() !== '',
  );

  public async linkCard() {
    if (!this.tokenCodeFullyFilled()) {
      this.showError.set(true);
      return;
    }

    try {
      await this.registrationApiService.linkCardToRegistration({
        programId: this.programId,
        referenceId: this.referenceId,
        tokenCode: this.tokenCode,
      });
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
    }
    this.closeDialog.emit();
    this.toastService.showToast({
      severity: 'success',
      detail: $localize`Link Visa card to registration`,
    });
  }
}
