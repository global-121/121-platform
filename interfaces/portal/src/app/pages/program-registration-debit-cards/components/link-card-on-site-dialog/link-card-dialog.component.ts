import { HttpStatusCode } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
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
import { isErrorWithStatusCode } from '~/utils/is-error-with-status-code.helper';

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
  readonly previousTokenCodes = input.required<string[]>();
  readonly programId = input.required<Signal<number | string>>();
  readonly referenceId = input.required<Signal<string | undefined>>();
  readonly dialogVisible = model.required<boolean>();

  readonly tokenCode = model('');
  readonly showTokenCodeInvalidWarning = signal<boolean>(false);
  readonly linkCardDialogState = signal<LinkCardDialogStates>(
    LinkCardDialogStates.linking,
  );

  readonly linkCardDialogStates = LinkCardDialogStates;

  readonly tokenCodeFullyFilled: Signal<boolean> = computed(
    () => !this.tokenCode().includes('_') && this.tokenCode() !== '',
  );

  readonly invalidTokenError = $localize`Fill up all 19 digits to link card`;

  readonly dialogTitle = computed(() => {
    if (this.currentTokenCode()) {
      return $localize`Replace visa card`;
    }

    return $localize`Link visa card`;
  });

  readonly confirmationButtonLabel = computed(() => {
    if (this.currentTokenCode()) {
      return $localize`Replace card`;
    }

    return $localize`Link card`;
  });

  readonly getTokenCodeWithoutDashes = ({
    tokenCodeToClean,
  }: {
    tokenCodeToClean: string;
  }) => tokenCodeToClean.replaceAll(/\D/g, '');

  readonly isError = computed(
    () => this.linkCardDialogState() !== LinkCardDialogStates.linking,
  );

  readonly errorMessage = computed(() => {
    if (!this.isError()) {
      return '';
    }

    if (
      this.linkCardDialogState() === this.linkCardDialogStates.errorNotFound
    ) {
      return $localize`Card number not found. Please go back and check that the number is correct.`;
    }

    if (
      this.linkCardDialogState() ===
      this.linkCardDialogStates.errorAlreadyLinkedToOther
    ) {
      return $localize`The card number you entered is already linked to another registration.`;
    }

    return $localize`The card number you entered is already linked to the current registration.`;
  });

  readonly errorInstructions = computed(() => {
    if (!this.isError()) {
      return '';
    }

    if (
      this.linkCardDialogState() === this.linkCardDialogStates.errorNotFound
    ) {
      return $localize`If the number is correct but this error persists, try a different card and inform your supervisor.`;
    }

    return $localize`Please link this registration to a different card and inform your supervisor.`;
  });

  resetData() {
    this.linkCardDialogState.set(LinkCardDialogStates.linking);
    this.tokenCode.set('');
  }

  async linkCard() {
    if (!this.tokenCodeFullyFilled()) {
      this.showTokenCodeInvalidWarning.set(true);
      return;
    }

    const currentTokenCodeWithoutDashes = this.getTokenCodeWithoutDashes({
      tokenCodeToClean: this.currentTokenCode() ?? '',
    });

    const previousTokenCodesWithoutDashes = this.previousTokenCodes().map(
      (tokenCode) =>
        this.getTokenCodeWithoutDashes({ tokenCodeToClean: tokenCode }),
    );

    const tokenCodeWithoutDashes = this.getTokenCodeWithoutDashes({
      tokenCodeToClean: this.tokenCode(),
    });

    if (
      tokenCodeWithoutDashes === currentTokenCodeWithoutDashes ||
      previousTokenCodesWithoutDashes.includes(tokenCodeWithoutDashes)
    ) {
      this.linkCardDialogState.set(
        LinkCardDialogStates.errorAlreadyLinkedToCurrent,
      );

      return;
    }

    try {
      if (this.currentTokenCode()) {
        await this.registrationApiService.replaceCardOnSite({
          programId: this.programId(),
          referenceId: this.referenceId(),
          tokenCode: tokenCodeWithoutDashes,
        });
      } else {
        await this.registrationApiService.linkCardToRegistration({
          programId: this.programId(),
          referenceId: this.referenceId(),
          tokenCode: tokenCodeWithoutDashes,
        });
      }

      this.toastService.showToast({
        severity: 'success',
        detail: $localize`Link Visa card to registration`,
      });

      this.dialogVisible.set(false);
    } catch (error) {
      if (
        isErrorWithStatusCode({ error, statusCode: HttpStatusCode.BadRequest })
      ) {
        this.linkCardDialogState.set(
          LinkCardDialogStates.errorAlreadyLinkedToOther,
        );
        return;
      }
      if (
        isErrorWithStatusCode({ error, statusCode: HttpStatusCode.NotFound })
      ) {
        this.linkCardDialogState.set(LinkCardDialogStates.errorNotFound);
        return;
      }

      this.toastService.showToast({
        severity: 'error',
        detail: $localize`An unexpected error occurred while linking the Visa card to the registration`,
      });
    }
  }

  goBackToLinkingState() {
    this.linkCardDialogState.set(this.linkCardDialogStates.linking);
  }
}
