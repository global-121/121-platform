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
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { Button } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputMask } from 'primeng/inputmask';

import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { FspConfigurationApiService } from '~/domains/fsp-configuration/fsp-configuration.api.service';
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
  private readonly fspConfigurationApiService = inject(
    FspConfigurationApiService,
  );

  readonly programId = input.required<string>();
  readonly referenceId = input.required<string | undefined>();
  readonly dialogVisible = input.required<boolean>();

  readonly closeDialog = output();

  readonly tokenCode = model('');
  readonly linkCardDialogState = model<LinkCardDialogStates>(
    LinkCardDialogStates.linking,
  );

  public linkCardDialogStates = LinkCardDialogStates;

  fspConfigurations = injectQuery(
    this.fspConfigurationApiService.getFspConfigurations(this.programId),
  );

  readonly tokenCodeInvalid: Signal<boolean> = computed(() =>
    this.tokenCode().includes('_'),
  );
  readonly toastText: Signal<string> = computed(() => {
    if (this.linkCardDialogState() === LinkCardDialogStates.linking) {
      return $localize`Link Visa card to registration`;
    }
    if (this.linkCardDialogState() === LinkCardDialogStates.replacing) {
      return $localize`Replace Visa card on registration`;
    }
    return '';
  });

  public async linkCard() {
    console.log('FSP CONFIGURATIONS', this.fspConfigurations.data());
    try {
      //TODO: determine based on program config whether to link or replace
      if ((Math.random() > 0.5 ? 1 : 0) === 1 /* postalCardDistribution */) {
        await this.registrationApiService.linkCardToRegistration({
          programId: this.programId,
          referenceId: this.referenceId,
          tokenCode: this.tokenCode,
        });
      } else {
        await this.registrationApiService.replaceCardOnSite({
          programId: this.programId,
          referenceId: this.referenceId,
          tokenCode: this.tokenCode,
        });
      }
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
    this.closeDialog.emit();
    this.toastService.showToast({
      severity: 'success',
      detail: $localize`${this.toastText()}`,
    });
  }
}
