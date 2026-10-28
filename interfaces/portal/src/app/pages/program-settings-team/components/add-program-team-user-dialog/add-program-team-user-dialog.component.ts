import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
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
import { tap } from 'rxjs';

import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { ManualLinkComponent } from '~/components/manual-link/manual-link.component';
import { SelectNoResultsMessageComponent } from '~/components/select-empty-message/select-no-results-message.component';
import { ProgramApiService } from '~/domains/program/program.api.service';
import {
  ProgramUserAssignment,
  ProgramUserWithRolesLabel,
} from '~/domains/program/program.model';
import { RoleApiService } from '~/domains/role/role.api.service';
import { UserAccessGroupFormComponent } from '~/pages/program-settings-team/components/add-program-team-user-dialog/user-access-group-form.component';
import { AuthService } from '~/services/auth.service';
import { ToastService } from '~/services/toast.service';
import {
  TrackingAction,
  TrackingCategory,
} from '~/services/tracking/tracking.enums';
import { TrackingService } from '~/services/tracking/tracking.service';
import { TranslatableStringService } from '~/services/translatable-string.service';
import { generateFieldErrors } from '~/utils/form-validation';

export interface AccessGroupAttribute {
  name: string;
  label: string | undefined;
  options: { option: string; label: string | undefined }[] | undefined;
}

@Component({
  selector: 'app-add-program-team-user-dialog',
  styles: ``,
  templateUrl: './add-program-team-user-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonModule,
    FormDialogComponent,
    FormFieldWrapperComponent,
    SelectModule,
    MultiSelectModule,
    InputTextModule,
    ReactiveFormsModule,
    ManualLinkComponent,
    SelectNoResultsMessageComponent,
    UserAccessGroupFormComponent,
  ],
})
export class AddProgramTeamUserDialogComponent {
  readonly programId = input.required<string>();
  readonly enableScope = input.required<boolean>();

  readonly userToEdit = input<ProgramUserWithRolesLabel | undefined>();

  private programApiService = inject(ProgramApiService);
  private roleApiService = inject(RoleApiService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private trackingService = inject(TrackingService);
  private translatableStringService = inject(TranslatableStringService);

  readonly formDialog = viewChild.required<FormDialogComponent>('formDialog');

  readonly isEditing = computed(() => !!this.userToEdit());

  program = injectQuery(this.programApiService.getProgram(this.programId));

  roles = injectQuery(this.roleApiService.getRoles());
  userSearchResults = injectQuery(
    this.programApiService.getUserSearchResults(
      this.programId,
      // NOTE: Hard-coded a generic search term, to replicate the "All Users"-endpoint; Should be replaced by user-provided search-query.
      signal('@'),
    ),
  );
  programUsers = injectQuery(
    this.programApiService.getProgramUsers(this.programId),
  );

  accessGroupLevels = injectQuery(
    this.programApiService.getProgramAccessGroupLevels({
      programId: this.programId,
    }),
  );

  readonly accessGroupAttributes = computed<AccessGroupAttribute[]>(() => {
    const accessGroupAttributes: AccessGroupAttribute[] = [];

    if (!this.program.isSuccess() || !this.accessGroupLevels.isSuccess()) {
      return [];
    }

    const accessGroupAttributeNames =
      this.accessGroupLevels.data().accessGroupRegistrationAttributeNames;

    if (accessGroupAttributeNames.length === 0) {
      return [];
    }

    const registrationAttributes =
      this.program.data().programRegistrationAttributes;

    for (const accessGroupAttributeName of accessGroupAttributeNames) {
      const registrationAttribute = registrationAttributes.find(
        (attr) => attr.name === accessGroupAttributeName,
      );

      if (registrationAttribute) {
        accessGroupAttributes.push({
          name: registrationAttribute.name,
          label: this.translatableStringService.translate(
            registrationAttribute.label,
          ),
          options: registrationAttribute.options?.map((option) => ({
            option: option.option,
            label: this.translatableStringService.translate(option.label),
          })),
        });
      }
    }
    return accessGroupAttributes;
  });

  formGroup = new FormGroup({
    userValue: new FormControl(-1, {
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required, Validators.min(0)],
      nonNullable: true,
    }),
    rolesValue: new FormControl<string[]>([], {
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required, Validators.minLength(1)],
      nonNullable: true,
    }),
    accessGroupsValue: new FormGroup({
      accessGroup1Value: new FormControl<null | string>(null),
      accessGroup2Value: new FormControl<null | string>(null),
      accessGroup3Value: new FormControl<null | string>(null),
    }),
  });

  formFieldErrors = generateFieldErrors(this.formGroup, {
    userValue: ({ invalid }) => {
      if (!invalid) {
        return;
      }
      return $localize`Selecting a user is required`;
    },
  });
  readonly dialogHeader = computed(() =>
    this.isEditing() ? $localize`Edit user` : $localize`Add user to team`,
  );
  readonly dialogHeaderIcon = computed(() =>
    this.isEditing() ? 'pi pi-pencil' : 'pi pi-plus',
  );
  readonly dialogProceedLabel = computed(() =>
    this.isEditing()
      ? $localize`:@@generic-save-changes:Save changes`
      : $localize`Add to team`,
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
      (!this.isEditing() && this.programUsers.isPending()),
  );
  readonly availableUsers = computed(() => {
    const userSearchResults = this.userSearchResults.data();
    const programUsers = this.programUsers.data();

    if (!programUsers || !userSearchResults) {
      return [];
    }

    if (this.isEditing()) {
      return userSearchResults;
    }

    return userSearchResults.filter(
      (anyUser) =>
        !programUsers.some(
          (thisProgramUser) => thisProgramUser.id === anyUser.id,
        ),
    );
  });
  assignUserMutation = injectMutation(() => ({
    mutationFn: ({
      userValue,
      rolesValue,
      accessGroupsValue,
    }: {
      userValue?: number; // this is undefined when editing because the field is disabled
      rolesValue: string[];
      accessGroupsValue: {
        accessGroup1Value: null | string;
        accessGroup2Value: null | string;
        accessGroup3Value: null | string;
      };
    }) => {
      const accessGroups: ProgramUserAssignment['accessGroups'] = [];

      for (const [index, value] of Object.values(accessGroupsValue).entries()) {
        const attribute = this.accessGroupAttributes()[index];
        if (value) {
          const programRegistrationAttributeName = attribute.name;
          accessGroups.push({ programRegistrationAttributeName, value });
        }
      }

      if (!userValue) {
        const userId = this.userToEdit()?.id;
        if (!userId) {
          throw new Error(
            $localize`:@@generic-error-try-again:An unexpected error has occurred. Please try again later.`,
          );
        }

        return this.programApiService.updateProgramUserAssignment(
          this.programId,
          {
            userId,
            roles: rolesValue,
            accessGroups,
          },
        );
      }

      return this.programApiService.assignProgramUser(this.programId, {
        userId: userValue,
        roles: rolesValue,
        accessGroups,
      });
    },
    onSuccess: () => {
      this.toastService.showToast({
        detail: this.isEditing()
          ? $localize`User updated`
          : $localize`User added`,
      });

      if (!this.isEditing()) {
        this.trackingService.trackEvent({
          category: TrackingCategory.programSettings,
          action: TrackingAction.addUserToProgramTeam,
        });
      }
    },
  }));
  noUsersFoundMessage = {
    message: $localize`This 121 portal doesn't have users to be added. Add users on the Users page, then assign them to this program.`,
    title: $localize`No users found.`,
  };

  constructor() {
    toObservable(this.userToEdit)
      .pipe(
        tap((user) => {
          if (user) {
            const accessGroupValues = user.accessGroups.map(
              (accessGroup) => accessGroup.value,
            );

            this.formGroup.patchValue({
              userValue: user.id,
              rolesValue: user.roles.map(({ role }) => role),
              accessGroupsValue: {
                accessGroup1Value: accessGroupValues[0] ?? null,
                accessGroup2Value: accessGroupValues[1] ?? null,
                accessGroup3Value: accessGroupValues[2] ?? null,
              },
            });

            this.formGroup.controls.userValue.disable();
          } else {
            this.formGroup.patchValue({
              userValue: -1,
            });
            this.formGroup.controls.userValue.enable();
          }
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  show() {
    this.formDialog().show({
      resetMutation: true,
    });
  }
}
