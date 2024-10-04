import {
  ChangeDetectionStrategy,
  Component,
  inject,
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
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';

import { FormSidebarComponent } from '~/components/form/form-sidebar.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { RoleApiService } from '~/domains/role/role.api.service';
import { UserApiService } from '~/domains/user/user.api.service';
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
  standalone: true,
  templateUrl: './add-user-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonModule,
    FormSidebarComponent,
    FormFieldWrapperComponent,
    DropdownModule,
    MultiSelectModule,
    InputTextModule,
    ReactiveFormsModule,
  ],
})
export class AddUserFormComponent {
  // userToEdit = input<ProjectUserWithRolesLabel | undefined>();
  formVisible = model.required<boolean>();

  // private projectApiService = inject(ProjectApiService);
  private userApiService = inject(UserApiService);
  private roleApiService = inject(RoleApiService);
  private toastService = inject(ToastService);

  // constructor() {
  //   effect(
  //     () => {
  //       const user = this.userToEdit();
  //       if (user) {
  //         this.formGroup.patchValue({
  //           userValue: user.id,
  //           rolesValue: user.roles.map(({ role }) => role),
  //           scopeValue: user.scope,
  //         });
  //         this.formGroup.controls.userValue.disable();
  //       } else {
  //         this.formGroup.patchValue({
  //           userValue: -1,
  //         });
  //         this.formGroup.controls.userValue.enable();
  //       }
  //     },
  //     {
  //       allowSignalWrites: true,
  //     },
  //   );
  // }

  // isEditing = computed(() => !!this.userToEdit());

  roles = injectQuery(this.roleApiService.getRoles());
  allUsers = injectQuery(this.userApiService.getAllUsers());

  formGroup = new FormGroup({
    usernameValue: new FormControl<string>('', {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      validators: [Validators.required],
      nonNullable: true,
    }),
    emailValue: new FormControl<string>('', {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      validators: [Validators.required, Validators.email],
      nonNullable: true,
    }),
  });

  formFieldErrors = generateFieldErrors<AddUserToTeamFormGroup>(
    this.formGroup,
    {
      usernameValue: genericFieldIsRequiredValidationMessage,
      emailValue: genericFieldIsRequiredValidationMessage,
    },
  );

  addUserMutation = injectMutation(() => ({
    mutationFn: ({
      usernameValue,
      emailValue,
    }: {
      usernameValue: string;
      emailValue: string;
    }) => {
      return this.userApiService.createUser({
        username: emailValue,
        displayName: usernameValue,
      });
    },
    onSuccess: () => {
      this.formVisible.set(false);
      this.formGroup.reset();

      this.toastService.showToast({
        detail: $localize`User added`,
      });

      void this.userApiService.invalidateCache();

      // this.toastService.showToast({
      //   detail: this.isEditing()
      //     ? $localize`User updated`
      //     : $localize`User added`,
      // });

      // void this.projectApiService.invalidateCache(this.projectId);
    },
  }));
}
