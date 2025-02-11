import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
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

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { FormSidebarComponent } from '~/components/form/form-sidebar.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { UserApiService } from '~/domains/user/user.api.service';
import { User } from '~/domains/user/user.model';
import { ToastService } from '~/services/toast.service';
import {
  generateFieldErrors,
  genericFieldIsRequiredValidationMessage,
} from '~/utils/form-validation';

type AddUserToTeamFormGroup =
  (typeof AddUserFormComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-add-user-form',
  styles: ``,
  templateUrl: './add-user-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonModule,
    FormSidebarComponent,
    FormFieldWrapperComponent,
    InputTextModule,
    ReactiveFormsModule,
  ],
})
export class AddUserFormComponent {
  readonly userToEdit = input<undefined | User>();
  readonly formVisible = model.required<boolean>();

  private userApiService = inject(UserApiService);
  private toastService = inject(ToastService);

  readonly isEditing = computed(() => !!this.userToEdit());
  allUsers = injectQuery(this.userApiService.getAllUsers());
  formGroup = new FormGroup({
    displayNameValue: new FormControl<string>('', {
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required],
      nonNullable: true,
    }),
    usernameValue: new FormControl<string>('', {
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required, Validators.email],
      nonNullable: true,
    }),
  });
  formFieldErrors = generateFieldErrors<AddUserToTeamFormGroup>(
    this.formGroup,
    {
      displayNameValue: genericFieldIsRequiredValidationMessage,
      usernameValue: (control) => {
        if (!control.invalid) {
          return;
        }
        return $localize`Enter a valid email address`;
      },
    },
  );
  userMutation = injectMutation(() => ({
    mutationFn: ({
      displayNameValue,
      usernameValue,
    }: {
      displayNameValue: string;
      usernameValue: string;
    }) => {
      if (this.isEditing()) {
        return this.userApiService.udpateUserDisplayName({
          id: this.userToEdit()?.id,
          displayName: displayNameValue,
        });
      }
      return this.userApiService.createUser({
        username: usernameValue,
        displayName: displayNameValue,
      });
    },
    onSuccess: () => {
      this.formVisible.set(false);
      this.formGroup.reset();

      this.toastService.showToast({
        detail: this.isEditing()
          ? $localize`User updated`
          : $localize`User added`,
      });

      void this.userApiService.invalidateCache();
    },
  }));
  constructor() {
    effect(() => {
      const user = this.userToEdit();
      if (user) {
        this.formGroup.patchValue({
          displayNameValue: user.displayName,
          usernameValue: user.username,
        });
        this.formGroup.controls.usernameValue.disable();
      } else {
        this.formGroup.controls.usernameValue.enable();
      }
    });
  }
}
