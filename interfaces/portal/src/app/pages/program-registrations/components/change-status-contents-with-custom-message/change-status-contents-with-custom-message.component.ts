import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { ButtonModule } from 'primeng/button';

import { Registration } from '~/domains/registration/registration.model';
import { ChangeStatusSubmitButtonsComponent } from '~/pages/program-registrations/components/change-status-submit-buttons/change-status-submit-buttons.component';
import { CustomMessageControlComponent } from '~/pages/program-registrations/components/custom-message-control/custom-message-control.component';
import { CustomMessagePreviewComponent } from '~/pages/program-registrations/components/custom-message-preview/custom-message-preview.component';
import { MessageInputData } from '~/services/messaging.service';
import { generateFieldErrors } from '~/utils/form-validation';

@Component({
  selector: 'app-change-status-contents-with-custom-message',
  imports: [
    CustomMessagePreviewComponent,
    CustomMessageControlComponent,
    ButtonModule,
    ReactiveFormsModule,
    ChangeStatusSubmitButtonsComponent,
  ],
  templateUrl: './change-status-contents-with-custom-message.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeStatusContentsWithCustomMessageComponent implements OnInit {
  readonly programId = input.required<string>();
  readonly previewRegistration = input.required<Registration | undefined>();
  readonly enableSendMessage = input.required<boolean>();
  readonly isMutating = input<boolean>(false);
  readonly cancelChangeStatus = output();
  readonly customMessageUpdated = output<string>();

  formGroup = new FormGroup({
    customMessage: new FormControl<string | undefined>(
      { value: undefined, disabled: false },
      {
        nonNullable: true,
        validators: [
          // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
          Validators.required,
          Validators.minLength(20),
        ],
      },
    ),
  });
  readonly previewData = signal<Partial<MessageInputData> | undefined>(
    undefined,
  );
  formFieldErrors = generateFieldErrors(this.formGroup);

  ngOnInit(): void {
    this.previewData.set(undefined);
  }

  cancelClick() {
    this.cancelChangeStatus.emit();
  }

  onProceedToPreview() {
    this.formGroup.markAllAsTouched();
    if (!this.formGroup.valid || !this.formGroup.value.customMessage) {
      return;
    }
    this.previewData.set({
      messageType: 'custom',
      customMessage: this.formGroup.value.customMessage,
    });
    this.customMessageUpdated.emit(this.formGroup.value.customMessage);
  }
}
