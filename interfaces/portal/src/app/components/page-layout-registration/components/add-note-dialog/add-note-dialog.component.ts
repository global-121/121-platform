import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  viewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { injectMutation } from '@tanstack/angular-query-experimental';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { TextareaModule } from 'primeng/textarea';

import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { ToastService } from '~/services/toast.service';
import { generateFieldErrors } from '~/utils/form-validation';

type AddNoteFormGroup =
  (typeof AddNoteDialogComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-add-note-dialog',
  imports: [
    FormDialogComponent,
    FormFieldWrapperComponent,
    TextareaModule,
    ReactiveFormsModule,
  ],
  providers: [ToastService],
  templateUrl: './add-note-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddNoteDialogComponent {
  private programApiService = inject(ProgramApiService);
  private registrationApiService = inject(RegistrationApiService);
  private toastService = inject(ToastService);

  readonly programId = input.required<string>();
  readonly registrationId = input.required<string>();

  readonly formDialog = viewChild.required<FormDialogComponent>('formDialog');

  program = injectQuery(this.programApiService.getProgram(this.programId));
  registration = injectQuery(
    this.registrationApiService.getRegistrationById(
      this.programId,
      this.registrationId,
    ),
  );

  formGroup = new FormGroup({
    note: new FormControl('', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required],
    }),
  });

  formFieldErrors = generateFieldErrors(this.formGroup);

  addNoteMutation = injectMutation(() => ({
    mutationFn: ({ note }: ReturnType<AddNoteFormGroup['getRawValue']>) => {
      const registrationReferenceId = this.registration.data()?.referenceId;

      if (!registrationReferenceId) {
        // Should never happen but makes TS happy
        throw new Error('Registration reference ID is missing');
      }

      return this.programApiService.addRegistrationNote({
        programId: this.programId,
        registrationReferenceId,
        note,
      });
    },
    onSuccess: () => {
      this.toastService.showToast({
        detail: $localize`Note successfully added.`,
      });
      void this.registrationApiService.invalidateCache({
        programId: this.programId,
      });
    },
  }));

  show() {
    this.formDialog().show({
      resetMutation: true,
    });
  }
}
