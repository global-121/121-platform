import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputMask } from 'primeng/inputmask';

import { RegistrationApiService } from '~/domains/registration/registration.api.service';

@Component({
  selector: 'app-link-card-dialog',
  imports: [InputMask, Button, FormsModule, Dialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './link-card-dialog.component.html',
})
export class LinkCardDialogComponent {
  readonly programId = input.required<string>();
  readonly referenceId = input.required<string | undefined>();
  readonly dialogVisible = input.required<boolean>();

  readonly closeDialog = output();

  readonly tokenCode = model('');

  private readonly registrationApiService = inject(RegistrationApiService);

  public async linkCard() {
    await this.registrationApiService.linkCardToRegistration({
      programId: this.programId,
      referenceId: this.referenceId,
      tokenCode: this.tokenCode,
    });
  }
}
