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
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';

import { FormSidebarComponent } from '~/components/form/form-sidebar.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { ProjectUserWithRolesLabel } from '~/domains/project/project.model';
import { RoleApiService } from '~/domains/role/role.api.service';
import { UserApiService } from '~/domains/user/user.api.service';
import { ToastService } from '~/services/toast.service';
import {
  generateFieldErrors,
  genericFieldIsRequiredValidationMessage,
} from '~/utils/form-validation';

type AddUserToTeamFormGroup =
  (typeof AddProjectTeamUserFormComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-add-project-team-user-form',
  styles: ``,
  templateUrl: './add-project-team-user-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonModule,
    FormSidebarComponent,
    FormFieldWrapperComponent,
    SelectModule,
    MultiSelectModule,
    InputTextModule,
    ReactiveFormsModule,
  ],
})
export class AddProjectTeamUserFormComponent {
  projectId = input.required<string>();
  enableScope = input.required<boolean>();
  formVisible = model.required<boolean>();
  userToEdit = input<ProjectUserWithRolesLabel | undefined>();

  private projectApiService = inject(ProjectApiService);
  private userApiService = inject(UserApiService);
  private roleApiService = inject(RoleApiService);
  private toastService = inject(ToastService);

  constructor() {
    effect(() => {
      const user = this.userToEdit();
      if (user) {
        this.formGroup.patchValue({
          userValue: user.id,
          rolesValue: user.roles.map(({ role }) => role),
          scopeValue: user.scope,
        });
        this.formGroup.controls.userValue.disable();
      } else {
        this.formGroup.patchValue({
          userValue: -1,
        });
        this.formGroup.controls.userValue.enable();
      }
    });
  }

  isEditing = computed(() => !!this.userToEdit());

  roles = injectQuery(this.roleApiService.getRoles());
  allUsers = injectQuery(this.userApiService.getAllUsers());
  projectUsers = injectQuery(
    this.projectApiService.getProjectUsers(this.projectId),
  );

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
    () =>
      this.allUsers.isPending() ||
      (!this.isEditing() && this.projectUsers.isPending()),
  );

  availableUsers = computed(() => {
    const allUsers = this.allUsers.data();
    const projectUsers = this.projectUsers.data();

    if (!projectUsers || !allUsers) {
      return [];
    }

    if (this.isEditing()) {
      return allUsers;
    }

    return allUsers.filter(
      (anyUser) =>
        !projectUsers.some(
          (thisProjectUser) => thisProjectUser.id === anyUser.id,
        ),
    );
  });

  assignUserMutation = injectMutation(() => ({
    mutationFn: ({
      userValue,
      rolesValue,
      scopeValue,
    }: {
      userValue?: number; // this is undefined when editing because the field is disabled
      rolesValue: string[];
      scopeValue: string;
    }) => {
      if (!userValue) {
        const userId = this.userToEdit()?.id;
        if (!userId) {
          throw new Error(
            $localize`:@@generic-error-try-again:An unexpected error has occurred. Please try again later.`,
          );
        }

        return this.projectApiService.updateProjectUserAssignment(
          this.projectId,
          {
            userId,
            roles: rolesValue,
            scope: scopeValue,
          },
        );
      }

      return this.projectApiService.assignProjectUser(this.projectId, {
        userId: userValue,
        roles: rolesValue,
        scope: scopeValue,
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

      void this.projectApiService.invalidateCache(this.projectId);
    },
  }));
}
