import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, FormsModule } from '@angular/forms';

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
  ],
  providers: [],
  templateUrl: './ignore-duplication-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IgnoreDuplicationDialogComponent {
  private registrationApiService = inject(RegistrationApiService);
  readonly projectId = input.required<string>();
  readonly registrationReferenceId = input.required<string>();
  readonly registrationRegistrationId = input.required<string>();

  duplicates = injectQuery(() => ({
    ...this.registrationApiService.getDuplicates({
      projectId: this.projectId,

      referenceId: this.registrationReferenceId(),
    })(),
    enabled: !!this.registrationReferenceId(),
  }));
  readonly duplicatesRegistrationIds = computed(() => {
    if (!this.registrationRegistrationId() || !this.duplicates.isSuccess()) {
      return [];
    }

    const registrationIds = [
      Number(this.registrationRegistrationId()),
      ...this.duplicates.data().map((d) => Number(d.registrationId)),
    ];

    return registrationIds;
  });
  readonly ignoreDuplicationDialog =
    viewChild.required<ConfirmationDialogComponent>('ignoreDuplicationDialog');
  formGroup!: FormGroup<
    Record<string, FormControl<boolean | number | string | undefined>>
  >;
  readonly updateReason = model<string>('');
  approveMutation = injectMutation(() => ({
    mutationFn: async ({ reason }: { reason: string }) => {
      if (!reason || reason.trim() === '') {
        throw new Error(
          $localize`:@@generic-required-field:This field is required.`,
        );
      }

      if (!this.registrationRegistrationId() || !this.duplicates.isSuccess()) {
        return;
      }

      return this.registrationApiService.ignoreDuplication({
        projectId: this.projectId,
        registrationIds: this.duplicatesRegistrationIds(),
        reason,
      });
    },
    onSuccess: () => {
      this.updateReason.set('');
      return this.registrationApiService.invalidateCache({
        projectId: this.projectId,
      });
    },
  }));
  formFieldErrors = generateFieldErrors<IgnoreDuplicationFormGroup>(
    this.formGroup,
    {
      reason: genericFieldIsRequiredValidationMessage,
    },
  );

  setVisible() {
    this.ignoreDuplicationDialog().askForConfirmation();
  }
}
