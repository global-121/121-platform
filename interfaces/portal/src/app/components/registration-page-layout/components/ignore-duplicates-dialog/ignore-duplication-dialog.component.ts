import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { InputTextModule } from 'primeng/inputtext';

import { ConfirmationDialogComponent } from '~/components/confirmation-dialog/confirmation-dialog.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import {
  generateFieldErrors,
  genericFieldIsRequiredValidationMessage,
} from '~/utils/form-validation';

type IgnoreDuplicationFormGroup =
  (typeof IgnoreDuplicationDialogComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-ignore-duplication-dialog',
  imports: [
    FormFieldWrapperComponent,
    InputTextModule,
    ConfirmationDialogComponent,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [],
  templateUrl: './ignore-duplication-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class IgnoreDuplicationDialogComponent {
  private registrationApiService = inject(RegistrationApiService);
  readonly projectId = input.required<string>();
  readonly referenceId = input.required<string>();
  readonly registrationId = input.required<string>();

  duplicates = injectQuery(() => ({
    ...this.registrationApiService.getDuplicates({
      projectId: this.projectId,

      referenceId: this.referenceId(),
    })(),
    enabled: !!this.referenceId(),
  }));

  readonly duplicatesRegistrationIds = computed(() => {
    if (!this.registrationId() || !this.duplicates.isSuccess()) {
      return [];
    }

    const registrationIds = [
      Number(this.registrationId()),
      ...this.duplicates.data().map((d) => Number(d.registrationId)),
    ];

    return registrationIds;
  });

  formGroup = new FormGroup({
    reason: new FormControl('', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required],
    }),
  });

  formFieldErrors = generateFieldErrors<IgnoreDuplicationFormGroup>(
    this.formGroup,
    {
      reason: genericFieldIsRequiredValidationMessage,
    },
  );

  approveMutation = injectMutation(() => ({
    mutationFn: ({
      reason,
    }: ReturnType<IgnoreDuplicationFormGroup['getRawValue']>) =>
      this.registrationApiService.ignoreDuplication({
        projectId: this.projectId,
        registrationIds: this.duplicatesRegistrationIds(),
        reason,
      }),
    onSuccess: () => {
      this.formGroup.reset();
      return this.registrationApiService.invalidateCache({
        projectId: this.projectId,
      });
    },
  }));
  readonly confirmationDialog = viewChild.required<ConfirmationDialogComponent>(
    'ignoreDuplicationDialog',
  );
  show() {
    this.confirmationDialog().askForConfirmation();
  }
}
