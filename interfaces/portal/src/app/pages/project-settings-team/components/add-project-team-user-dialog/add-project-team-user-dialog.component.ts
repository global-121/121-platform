import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
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
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';

import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { ProjectUserWithRolesLabel } from '~/domains/project/project.model';
import { RoleApiService } from '~/domains/role/role.api.service';
import { AuthService } from '~/services/auth.service';
import { ToastService } from '~/services/toast.service';
import { generateFieldErrors } from '~/utils/form-validation';

@Component({
  selector: 'app-add-project-team-user-dialog',
  styles: ``,
  templateUrl: './add-project-team-user-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonModule,
    FormDialogComponent,
    FormFieldWrapperComponent,
    SelectModule,
    MultiSelectModule,
    InputTextModule,
    ReactiveFormsModule,
  ],
})
export class AddProjectTeamUserDialogComponent {
  readonly projectId = input.required<string>();
  readonly enableScope = input.required<boolean>();
  readonly userToEdit = input<ProjectUserWithRolesLabel | undefined>();

  private projectApiService = inject(ProjectApiService);
  private roleApiService = inject(RoleApiService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);

  readonly formDialog = viewChild.required<FormDialogComponent>('formDialog');

  readonly isEditing = computed(() => !!this.userToEdit());

  roles = injectQuery(this.roleApiService.getRoles());
  userSearchResults = injectQuery(
    this.projectApiService.getUserSearchResults(
      this.projectId,
      // NOTE: Hard-coded a generic search term, to replicate the "All Users"-endpoint; Should be replaced by user-provided search-query.
      signal('@'),
    ),
  );
  projectUsers = injectQuery(
    this.projectApiService.getProjectUsers(this.projectId),
  );

  formGroup = new FormGroup({
    userValue: new FormControl<number>(-1, {
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required, Validators.min(0)],
      nonNullable: true,
    }),
    rolesValue: new FormControl<string[]>([], {
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required, Validators.minLength(1)],
      nonNullable: true,
    }),
    scopeValue: new FormControl<string>('', {
      validators: [Validators.pattern(/^\S*$/)],
      nonNullable: true,
    }),
  });

  formFieldErrors = generateFieldErrors(this.formGroup, {
    scopeValue: (control) => {
      if (!control.invalid) {
        return;
      }
      return $localize`Enter a valid scope. No spaces are allowed.`;
    },
  });

  readonly dialogHeader = computed(() =>
    this.isEditing() ? $localize`Edit user` : $localize`Add user to team`,
  );

  readonly dialogHeaderIcon = computed(() =>
    this.isEditing() ? 'pi pi-pencil' : 'pi pi-plus',
  );

  readonly dialogProceedLabel = computed(() =>
    this.isEditing() ? $localize`Save changes` : $localize`Add to team`,
  );

  readonly userIsUpdatingItself = computed(() => {
    const user = this.userToEdit();
    if (!user) {
      return false;
    }
    return this.authService.user?.username === user.username;
  });

  readonly availableUsersIsLoading = computed(
    () =>
      this.userSearchResults.isPending() ||
      (!this.isEditing() && this.projectUsers.isPending()),
  );

  readonly availableUsers = computed(() => {
    const userSearchResults = this.userSearchResults.data();
    const projectUsers = this.projectUsers.data();

    if (!projectUsers || !userSearchResults) {
      return [];
    }

    if (this.isEditing()) {
      return userSearchResults;
    }

    return userSearchResults.filter(
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
      this.toastService.showToast({
        detail: this.isEditing()
          ? $localize`User updated`
          : $localize`User added`,
      });

      void this.projectApiService.invalidateCache(this.projectId);
    },
  }));

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

  show() {
    this.formDialog().show({
      resetMutation: true,
    });
  }
}
