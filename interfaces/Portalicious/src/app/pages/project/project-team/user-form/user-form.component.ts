/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
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
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { FormSidebarComponent } from '~/components/form/form-sidebar.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { RoleApiService } from '~/domains/role/role.api.service';
import { UserApiService } from '~/domains/user/user.api.service';
import type { AddUserButtonComponent } from '~/pages/project/project-team/add-user-button/add-user-button.component';
import { ToastService } from '~/services/toast.service';
import {
  generateFieldErrors,
  genericFieldIsRequiredValidationMessage,
} from '~/utils/form-validation';

type AddUserToTeamFormGroup =
  (typeof AddUserButtonComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    FormSidebarComponent,
    FormFieldWrapperComponent,
    DropdownModule,
    MultiSelectModule,
    InputTextModule,
    ReactiveFormsModule,
  ],
  templateUrl: './user-form.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormComponent {
  mode = input.required<'edit' | 'new'>();
  projectId = input.required<number>();
  enableScope = input.required<boolean | undefined>();

  private projectApiService = inject(ProjectApiService);
  private userApiService = inject(UserApiService);
  private roleApiService = inject(RoleApiService);
  private toastService = inject(ToastService);

  roles = injectQuery(this.roleApiService.getRoles());
  allUsers = injectQuery(this.userApiService.getAllUsers());
  projectUsers = injectQuery(
    this.projectApiService.getProjectUsers(this.projectId),
  );

  formTitle = input.required<string>();
  formVisible = input.required<boolean>();

  formGroup = new FormGroup({
    userValue: new FormControl<number>(-1, {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      validators: [Validators.required, Validators.min(0)],
      nonNullable: true,
    }),
    rolesValue: new FormControl<string[]>([], {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      validators: [Validators.required, Validators.minLength(1)],
      nonNullable: true,
    }),
    scopeValue: new FormControl<string>('', {
      validators: [Validators.pattern(/^\S*$/)],
      nonNullable: true,
    }),
  });

  formFieldErrors = generateFieldErrors<AddUserToTeamFormGroup>(
    this.formGroup,
    {
      userValue: genericFieldIsRequiredValidationMessage,
      rolesValue: genericFieldIsRequiredValidationMessage,
      scopeValue: (control) => {
        if (!control.invalid) {
          return;
        }
        return $localize`Enter a valid scope. No spaces are allowed.`;
      },
    },
  );

  availableUsersIsLoading = computed(
    () => this.allUsers.isPending() || this.projectUsers.isPending(),
  );

  availableUsers = computed(() => {
    const allUsers = this.allUsers.data();
    const projectUsers = this.projectUsers.data();

    if (!projectUsers || !allUsers) {
      return [];
    }
    return allUsers.filter(
      (anyUser) =>
        !projectUsers.some(
          (thisProjectUser) => thisProjectUser.id === anyUser.id,
        ),
    );
  });

  getMutation() {
    return this.mode() === 'edit'
      ? this.updateUserAssignmentMutation
      : this.assignUserMutation;
  }

  assignUserMutation = injectMutation(() => ({
    mutationFn: ({
      userValue,
      rolesValue,
      scopeValue,
    }: Required<AddUserToTeamFormGroup['value']>) => {
      return this.projectApiService.assignProjectUser(this.projectId, {
        userId: userValue,
        roles: rolesValue,
        scope: scopeValue,
      });
    },
    onSuccess: () => {
      this.onSubmitSuccess($localize`User added`);
    },
  }));

  updateUserAssignmentMutation = injectMutation(() => ({
    mutationFn: ({
      userValue,
      rolesValue,
      scopeValue,
    }: Required<AddUserToTeamFormGroup['value']>) => {
      return this.projectApiService.updateProjectUserAssignment(
        this.projectId,
        {
          userId: userValue,
          roles: rolesValue,
          scope: scopeValue,
        },
      );
    },
    onSuccess: () => {
      this.onSubmitSuccess($localize`User assignment updated`);
    },
  }));

  onSubmitSuccess(message: string) {
    this.formVisible.set(false);
    this.formGroup.reset();

    this.toastService.showToast({
      detail: message,
    });

    void this.projectApiService.invalidateCache(this.projectId);
  }
}
