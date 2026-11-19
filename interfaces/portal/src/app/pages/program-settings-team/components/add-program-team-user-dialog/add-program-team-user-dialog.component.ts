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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormArray,
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

import { MAX_ACCESS_GROUP_LEVELS } from '@121-service/src/programs/access-group-levels/const/max-access-group-levels.const';

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
import { AccessGroupAttribute } from '~/pages/program-settings-team/program-settings-team.page';
import { AuthService } from '~/services/auth.service';
import { ToastService } from '~/services/toast.service';
import {
  TrackingAction,
  TrackingCategory,
} from '~/services/tracking/tracking.enums';
import { TrackingService } from '~/services/tracking/tracking.service';
import { generateFieldErrors } from '~/utils/form-validation';

const FIRST_ACCESS_GROUP_LEVEL = 1;
const ACCESS_GROUP_LEVELS = Array.from(
  { length: MAX_ACCESS_GROUP_LEVELS },
  (_, index) => index + FIRST_ACCESS_GROUP_LEVEL,
);

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
  readonly accessGroupsContext = input.required<{
    isReady: boolean;
    enableAccessGroups: boolean;
    accessGroupAttributes: AccessGroupAttribute[];
  }>();

  readonly userToEdit = signal<ProgramUserWithRolesLabel | undefined>(
    undefined,
  );
  readonly isFormPrefillPending = signal(false);

  private programApiService = inject(ProgramApiService);
  private roleApiService = inject(RoleApiService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private trackingService = inject(TrackingService);

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

  private readonly isFormDataReady = computed(
    () =>
      this.program.isSuccess() &&
      this.roles.isSuccess() &&
      this.programUsers.isSuccess() &&
      this.accessGroupsContext().isReady,
  );

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
    scopeValue: new FormControl('', {
      validators: [Validators.pattern(/^\S*$/)],
      nonNullable: true,
    }),
    accessGroupsValue: new FormArray(
      ACCESS_GROUP_LEVELS.map(
        (level) =>
          new FormControl<null | string>({
            value: null,
            disabled: level > FIRST_ACCESS_GROUP_LEVEL,
          }),
      ),
    ),
  });

  formFieldErrors = generateFieldErrors(this.formGroup, {
    userValue: ({ invalid }) => {
      if (!invalid) {
        return;
      }
      return $localize`Selecting a user is required`;
    },
    scopeValue: ({ invalid }) => {
      if (!invalid) {
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
      scopeValue,
      accessGroupsValue,
    }: {
      userValue?: number; // this is undefined when editing because the field is disabled
      rolesValue: string[];
      scopeValue: string;
      accessGroupsValue: (null | string)[];
    }) => {
      const accessGroups: ProgramUserAssignment['accessGroups'] = [];

      for (const [index, value] of accessGroupsValue.entries()) {
        const attribute =
          this.accessGroupsContext().accessGroupAttributes[index];
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
            scope: scopeValue,
            accessGroups,
          },
        );
      }

      return this.programApiService.assignProgramUser(this.programId, {
        userId: userValue,
        roles: rolesValue,
        scope: scopeValue,
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
    effect(() => {
      if (!this.isFormPrefillPending() || !this.isFormDataReady()) {
        return;
      }

      this.prefillForm({ userToEdit: this.userToEdit() });
      this.isFormPrefillPending.set(false);
    });

    const accessGroupControls =
      this.formGroup.controls.accessGroupsValue.controls;

    for (const [index, previousLevelControl] of accessGroupControls.entries()) {
      const control = accessGroupControls.at(index + 1);

      if (!control) {
        continue;
      }

      this.enableAccessGroupControlOnlyWhenPreviousLevelIsSelected({
        previousLevelControl,
        control,
      });
    }
  }

  private enableAccessGroupControlOnlyWhenPreviousLevelIsSelected({
    previousLevelControl,
    control,
  }: {
    previousLevelControl: FormControl<null | string>;
    control: FormControl<null | string>;
  }) {
    previousLevelControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((previousLevelValue) => {
        if (previousLevelValue) {
          control.enable();
          return;
        }

        control.setValue(null);
        control.disable();
      });
  }

  show({ userToEdit }: { userToEdit?: ProgramUserWithRolesLabel } = {}) {
    this.userToEdit.set(userToEdit);

    this.formDialog().show({
      resetMutation: true,
    });

    this.isFormPrefillPending.set(true);
  }

  private prefillForm({
    userToEdit,
  }: {
    userToEdit?: ProgramUserWithRolesLabel;
  }) {
    if (!userToEdit) {
      this.formGroup.controls.userValue.enable();
      return;
    }

    const accessGroupValues = new Map<number, string>();

    for (const userAccessGroup of userToEdit.accessGroups) {
      const attribute = this.accessGroupsContext().accessGroupAttributes.find(
        (attr) =>
          attr.name === userAccessGroup.programRegistrationAttributeName,
      );
      if (attribute) {
        accessGroupValues.set(attribute.level, userAccessGroup.value);
      }
    }

    this.formGroup.patchValue({
      userValue: userToEdit.id,
      rolesValue: userToEdit.roles.map(({ role }) => role),
      scopeValue: userToEdit.scope,
      accessGroupsValue: ACCESS_GROUP_LEVELS.map(
        (level) => accessGroupValues.get(level) ?? null,
      ),
    });

    this.formGroup.controls.userValue.disable();
  }
}
