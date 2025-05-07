import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  model,
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

import { FormSidebarComponent } from '~/components/form/form-sidebar.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { ToastService } from '~/services/toast.service';
import {
  generateFieldErrors,
  genericFieldIsRequiredValidationMessage,
} from '~/utils/form-validation';

type AddNoteFormGroup = (typeof AddNoteFormComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-add-note-form',
  imports: [
    FormSidebarComponent,
    FormFieldWrapperComponent,
    TextareaModule,
    ReactiveFormsModule,
  ],
  providers: [ToastService],
  templateUrl: './add-note-form.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddNoteFormComponent {
  private projectApiService = inject(ProjectApiService);
  private registrationApiService = inject(RegistrationApiService);
  private toastService = inject(ToastService);

  readonly formVisible = model.required<boolean>();
  readonly projectId = input.required<string>();
  readonly registrationId = input.required<string>();

  project = injectQuery(this.projectApiService.getProject(this.projectId));
  registration = injectQuery(
    this.registrationApiService.getRegistrationById(
      this.projectId,
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

  formFieldErrors = generateFieldErrors<AddNoteFormGroup>(this.formGroup, {
    note: genericFieldIsRequiredValidationMessage,
  });

  addNoteMutation = injectMutation(() => ({
    mutationFn: ({ note }: ReturnType<AddNoteFormGroup['getRawValue']>) => {
      const registrationReferenceId = this.registration.data()?.referenceId;

      if (!registrationReferenceId) {
        // Should never happen but makes TS happy
        throw new Error('Registration reference ID is missing');
      }

      return this.projectApiService.addRegistrationNote({
        projectId: this.projectId,
        registrationReferenceId,
        note,
      });
    },
    onSuccess: () => {
      this.formGroup.reset();
      this.toastService.showToast({
        detail: $localize`Note successfully added.`,
      });
      void this.registrationApiService.invalidateCache({
        projectId: this.projectId,
      });
      this.formVisible.set(false);
    },
  }));
}
