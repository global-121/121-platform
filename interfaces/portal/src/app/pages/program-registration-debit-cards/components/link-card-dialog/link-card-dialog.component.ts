import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Button } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputMask } from 'primeng/inputmask';

import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { LinkCardDialogStates } from '~/pages/program-registration-debit-cards/components/link-card-dialog/enums/link-card-dialog-states.enum';

@Component({
  selector: 'app-link-card-dialog',
  imports: [InputMask, Button, FormsModule, DialogModule, FormErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './link-card-dialog.component.html',
})
export class LinkCardDialogComponent {
  readonly programId = input.required<string>();
  readonly referenceId = input.required<string | undefined>();
  readonly dialogVisible = input.required<boolean>();

  readonly closeDialog = output();

  readonly tokenCode = model('');
  readonly linkCardDialogState = model<LinkCardDialogStates>(
    LinkCardDialogStates.linking,
  );

  public linkCardDialogStates = LinkCardDialogStates;

  private readonly registrationApiService = inject(RegistrationApiService);

  readonly tokenCodeInvalid = computed(() => this.tokenCode().includes('_'));

  public async linkCard() {
    try {
      await this.registrationApiService.linkCardToRegistration({
        programId: this.programId,
        referenceId: this.referenceId,
        tokenCode: this.tokenCode,
      });
    } catch (error) {
      if (
        error instanceof HttpErrorResponse &&
        //TODO: determine right error code
        error.status === 121
      ) {
        this.linkCardDialogState.set(LinkCardDialogStates.errorAlreadyLinked);
        return;
      }

      if (
        error instanceof HttpErrorResponse &&
        //TODO: determine right error code
        error.status === 121
      ) {
        this.linkCardDialogState.set(LinkCardDialogStates.errorAlreadyLinked);
        return;
      }
    }
  }
}
