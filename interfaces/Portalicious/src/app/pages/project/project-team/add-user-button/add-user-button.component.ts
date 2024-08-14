import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
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
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { FormSidebarComponent } from '~/components/form/form-sidebar.component';
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
  (typeof AddUserButtonComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-add-user-button',
  styles: ``,
  standalone: true,
  templateUrl: './add-user-button.component.html',
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
export class AddUserButtonComponent {
  projectId = input.required<number>();
  projectUsers = input.required<ProjectUserWithRolesLabel[] | undefined>();
  enableScope = input.required<boolean | undefined>();

  private projectApiService = inject(ProjectApiService);
  private userApiService = inject(UserApiService);
  private roleApiService = inject(RoleApiService);
  private toastService = inject(ToastService);

  formVisible = signal(false);

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

  allUsers = injectQuery(this.userApiService.getAllUsers());

  unassignedUsers = computed(() => {
    this.projectUsers();
    const allUsers = this.allUsers.data();
    if (!this.projectUsers() || !allUsers) {
      return [];
    }
    return allUsers.filter(
      (anyUser) =>
        !this.projectUsers()?.some(
          (thisProjectUser) => thisProjectUser.id === anyUser.id,
        ),
    );
  });

  roles = injectQuery(this.roleApiService.getRoles());

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
      this.formVisible.set(false);
      this.formGroup.reset();

      this.toastService.showToast({
        detail: $localize`User added`,
      });

      void this.projectApiService.invalidateCache(this.projectId);
    },
  }));
}
