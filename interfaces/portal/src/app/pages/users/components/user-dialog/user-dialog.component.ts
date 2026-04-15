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
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { ManualLinkComponent } from '~/components/manual-link/manual-link.component';
import { UserApiService } from '~/domains/user/user.api.service';
import { User } from '~/domains/user/user.model';
import { ToastService } from '~/services/toast.service';
import { generateFieldErrors } from '~/utils/form-validation';

@Component({
  selector: 'app-user-dialog',
  styles: ``,
  templateUrl: './user-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonModule,
    FormDialogComponent,
    FormFieldWrapperComponent,
    InputTextModule,
    ReactiveFormsModule,
    ManualLinkComponent,
  ],
})
export class UserDialogComponent {
  private toastService = inject(ToastService);
  private userApiService = inject(UserApiService);

  readonly formDialog = viewChild.required<FormDialogComponent>('formDialog');

  readonly userToEdit = input<undefined | User>();
  readonly isEditing = computed(() => !!this.userToEdit());

  allUsers = injectQuery(this.userApiService.getAllUsers());

  readonly dialogTranslations = computed(() => {
    if (this.isEditing()) {
      return {
        header: $localize`Edit user`,
        proceedLabel: $localize`Save changes`,
        headerIcon: 'pi pi-pencil',
      };
    }
    return {
      header: $localize`Add user`,
      proceedLabel: $localize`Create user`,
      headerIcon: 'pi pi-plus',
    };
  });

  formGroup = new FormGroup({
    displayNameValue: new FormControl('', {
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required],
      nonNullable: true,
    }),
    usernameValue: new FormControl('', {
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required, Validators.email],
      nonNullable: true,
    }),
  });

  formFieldErrors = generateFieldErrors(this.formGroup);

  userMutation = injectMutation(() => ({
    mutationFn: ({
      displayNameValue,
      usernameValue,
    }: {
      displayNameValue: string;
      usernameValue: string;
    }) => {
      if (this.isEditing()) {
        return this.userApiService.updateUserDisplayName({
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
      this.toastService.showToast({
        detail: this.isEditing()
          ? $localize`User updated`
          : $localize`User added`,
      });
    },
  }));

  addUser() {
    this.formDialog().show({
      resetFormGroup: true,
    });
    this.formGroup.controls.usernameValue.enable();
  }

  editUser() {
    if (!this.userToEdit()) return;

    this.formGroup.patchValue({
      displayNameValue: this.userToEdit()?.displayName,
      usernameValue: this.userToEdit()?.username,
    });
    this.formGroup.controls.usernameValue.disable();

    this.formDialog().show({
      resetFormGroup: false,
    });
  }
}
