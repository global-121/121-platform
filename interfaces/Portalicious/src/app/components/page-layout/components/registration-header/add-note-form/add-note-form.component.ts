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
import { InputTextareaModule } from 'primeng/inputtextarea';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { FormSidebarComponent } from '~/components/form/form-sidebar.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { ToastService } from '~/services/toast.service';
import {
  generateFieldErrors,
  genericFieldIsRequiredValidationMessage,
} from '~/utils/form-validation';

type AddNoteFormGroup = (typeof AddNoteFormComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-add-note-form',
  standalone: true,
  imports: [
    FormSidebarComponent,
    FormFieldWrapperComponent,
    InputTextareaModule,
    ReactiveFormsModule,
  ],
  providers: [ToastService],
  templateUrl: './add-note-form.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddNoteFormComponent {
  private projectApiService = inject(ProjectApiService);
  private toastService = inject(ToastService);

  formVisible = model.required<boolean>();
  projectId = input.required<number>();
  registrationReferenceId = input.required<string>();
  registrationName = input<null | string>();

  formGroup = new FormGroup({
    note: new FormControl('', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      validators: [Validators.required],
    }),
  });

  formFieldErrors = generateFieldErrors<AddNoteFormGroup>(this.formGroup, {
    note: genericFieldIsRequiredValidationMessage,
  });

  addNoteMutation = injectMutation(() => ({
    mutationFn: ({ note }: Required<AddNoteFormGroup['value']>) =>
      this.projectApiService.addRegistrationNote({
        projectId: this.projectId,
        registrationReferenceId: this.registrationReferenceId,
        note,
      }),
    onSuccess: () => {
      this.formGroup.reset();
      this.toastService.showToast({
        detail: $localize`Note successfully added.`,
      });
      this.formVisible.set(false);
    },
  }));
}
