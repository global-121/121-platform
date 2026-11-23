import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import { MenuItem } from '@openng/optimus-ui/api';
import { ButtonModule } from '@openng/optimus-ui/button';
import { CardModule } from '@openng/optimus-ui/card';
import { ConfirmDialogModule } from '@openng/optimus-ui/confirmdialog';
import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { DefaultUserRole } from '@121-service/src/user/enum/user-role.enum';

import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { InfoTooltipData } from '~/components/info-tooltip/info-tooltip.component';
import { PageLayoutProgramSettingsComponent } from '~/components/page-layout-program-settings/page-layout-program-settings.component';
import { QueryTableComponent } from '~/components/query-table/query-table.component';
import { QueryTableColumn } from '~/components/query-table/query-table.types';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { ProgramUserWithRolesLabel } from '~/domains/program/program.model';
import { AddProgramTeamUserDialogComponent } from '~/pages/program-settings-team/components/add-program-team-user-dialog/add-program-team-user-dialog.component';
import { AuthService } from '~/services/auth.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';
import { InfoTooltipTrackingName } from '~/services/tracking/tracking.enums';
import { TranslatableStringService } from '~/services/translatable-string.service';

export interface AccessGroupAttribute {
  level: number;
  name: string;
  label: string | undefined;
  options: { option: string; label: string | undefined }[] | undefined;
}

type ProgramUserWithAccessGroupsLabel = {
  accessGroupsLabel: string;
} & ProgramUserWithRolesLabel;

const ACCESS_GROUPS_LABEL_SEPARATOR = ' / ';

const ADMIN_ROLE_NAME: string = DefaultUserRole.Admin;

const ADMIN_ACCESS_TO_ALL_GROUPS_TOOLTIP: InfoTooltipData = {
  message: $localize`The data access group for users with Admin role is always set to all data and can't be changed.`,
  trackingName: InfoTooltipTrackingName.programTeamTableAccessGroupAdmin,
};

@Component({
  selector: 'app-program-settings-team',
  imports: [
    ButtonModule,
    QueryTableComponent,
    AddProgramTeamUserDialogComponent,
    ConfirmDialogModule,
    FormDialogComponent,
    PageLayoutProgramSettingsComponent,
    CardModule,
  ],
  providers: [ToastService],
  templateUrl: './program-settings-team.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramSettingsTeamPageComponent {
  readonly rtlHelper = inject(RtlHelperService);
  readonly programId = input.required<string>();

  private programApiService = inject(ProgramApiService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private translatableStringService = inject(TranslatableStringService);

  readonly addUserDialog =
    viewChild.required<AddProgramTeamUserDialogComponent>('addUserDialog');
  readonly removeUserConfirmationDialog =
    viewChild.required<FormDialogComponent>('removeUserConfirmationDialog');

  readonly selectedUser = signal<ProgramUserWithRolesLabel | undefined>(
    undefined,
  );

  program = injectQuery(this.programApiService.getProgram(this.programId));
  programUsers = injectQuery(
    this.programApiService.getProgramUsers(this.programId),
  );
  accessGroupLevels = injectQuery(
    this.programApiService.getProgramAccessGroupLevels({
      programId: this.programId,
    }),
  );

  readonly enableAccessGroups = computed(() => {
    if (!this.accessGroupLevels.isSuccess()) {
      return false;
    }

    const data = this.accessGroupLevels.data();

    return data.accessGroupRegistrationAttributeNames.length > 0;
  });

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

    for (const [
      index,
      accessGroupAttributeName,
    ] of accessGroupAttributeNames.entries()) {
      const registrationAttribute = registrationAttributes.find(
        (attr) => attr.name === accessGroupAttributeName,
      );

      if (registrationAttribute) {
        accessGroupAttributes.push({
          level: index + 1,
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

  readonly accessGroupContext = computed(() => {
    return {
      isReady: this.program.isSuccess() && this.accessGroupLevels.isSuccess(),
      enableAccessGroups: this.enableAccessGroups(),
      accessGroupAttributes: this.accessGroupAttributes(),
    };
  });

  readonly programUsersWithAccessGroupsLabel = computed<
    ProgramUserWithAccessGroupsLabel[]
  >(() => {
    if (!this.programUsers.isSuccess()) {
      return [];
    }

    const accessGroupAttributes = this.accessGroupAttributes();

    return this.programUsers.data().map((programUser) => ({
      ...programUser,
      accessGroupsLabel: this.getAccessGroupsLabel({
        accessGroups: programUser.accessGroups,
        accessGroupAttributes,
      }),
    }));
  });

  removeUserMutation = injectMutation<unknown, Error, { userId?: number }>(
    () => ({
      mutationFn: ({ userId }) =>
        this.programApiService.removeProgramUser(this.programId, userId),
      onSuccess: () => {
        this.toastService.showToast({
          detail: $localize`User removed`,
        });
      },
      onError: () => {
        this.toastService.showGenericError();
      },
    }),
  );
  readonly columns = computed<
    QueryTableColumn<ProgramUserWithAccessGroupsLabel>[]
  >(() => {
    const scopeColumn: QueryTableColumn<ProgramUserWithAccessGroupsLabel> = {
      field: 'scope',
      header: $localize`:@@attribute-label-scope:Scope`,
      class: 'w-1/3',
    };

    const accessGroupsColumn: QueryTableColumn<ProgramUserWithAccessGroupsLabel> =
      {
        field: 'accessGroupsLabel',
        header: $localize`Access group`,
        class: 'w-1/3',
        tooltip: {
          message: $localize`Access groups are defined in the Registration data section of settings. You can limit the registrations your team member has access to by assigning the appropriate group.`,
          trackingName: InfoTooltipTrackingName.programTeamTableAccessGroup,
        },
        getCellTooltip: (programUser) =>
          this.getAccessGroupsCellTooltip({ programUser }),
      };

    return [
      {
        field: 'username',
        header: $localize`User name`,
        class: 'w-1/3 align-top',
      },
      {
        field: 'allRolesLabel',
        header: $localize`Roles`,
        class: 'w-1/3',
      },
      ...(this.enableScope() ? [scopeColumn] : []),
      ...(this.enableAccessGroups() ? [accessGroupsColumn] : []),
    ];
  });
  readonly canManageAidworkers = computed(() =>
    this.authService.hasPermission({
      programId: this.programId(),
      requiredPermission: PermissionEnum.AidWorkerProgramUPDATE,
    }),
  );
  readonly enableScope = computed(
    () => this.program.data()?.enableScope ?? false,
  );
  readonly contextMenuItems = computed<MenuItem[]>(() => [
    {
      label: $localize`Copy email`,
      icon: 'pi pi-copy',
      command: () => {
        const user = this.selectedUser();
        if (!user) {
          this.toastService.showGenericError();
          return;
        }
        void navigator.clipboard.writeText(user.username);
        this.toastService.showToast({
          detail: $localize`Email copied to clipboard`,
        });
      },
    },
    {
      label: $localize`:@@generic-edit:Edit`,
      icon: 'pi pi-pencil',
      visible: this.canManageAidworkers(),
      command: () => {
        this.openEditUserForm();
      },
    },
    {
      label: $localize`:@@remove-user-button:Remove user`,
      icon: 'pi pi-trash text-red-500',
      visible: this.canManageAidworkers(),
      command: () => {
        this.removeUserConfirmationDialog().show();
      },
    },
  ]);
  private getAccessGroupsLabel({
    accessGroups,
    accessGroupAttributes,
  }: {
    accessGroups: ProgramUserWithRolesLabel['accessGroups'];
    accessGroupAttributes: AccessGroupAttribute[];
  }): string {
    if (accessGroups.length === 0) {
      return $localize`All`;
    }

    return accessGroups
      .map((accessGroup) =>
        this.getAccessGroupLabel({ accessGroup, accessGroupAttributes }),
      )
      .join(ACCESS_GROUPS_LABEL_SEPARATOR);
  }

  private getAccessGroupLabel({
    accessGroup,
    accessGroupAttributes,
  }: {
    accessGroup: ProgramUserWithRolesLabel['accessGroups'][number];
    accessGroupAttributes: AccessGroupAttribute[];
  }): string {
    const attribute = accessGroupAttributes.find(
      ({ name }) => name === accessGroup.programRegistrationAttributeName,
    );

    if (!attribute) {
      return accessGroup.value;
    }

    const option = attribute.options?.find(
      (attributeOption) => attributeOption.option === accessGroup.value,
    );

    if (!option) {
      return accessGroup.value;
    }

    return option.label ?? option.option;
  }

  private getAccessGroupsCellTooltip({
    programUser,
  }: {
    programUser: ProgramUserWithAccessGroupsLabel;
  }): InfoTooltipData | undefined {
    const hasAccessToAllGroups = programUser.accessGroups.length === 0;

    if (!hasAccessToAllGroups) {
      return;
    }

    const hasAdminRole = programUser.roles.some(
      ({ role }) => role === ADMIN_ROLE_NAME,
    );

    if (!hasAdminRole) {
      return;
    }

    return ADMIN_ACCESS_TO_ALL_GROUPS_TOOLTIP;
  }

  openAddUserForm() {
    this.addUserDialog().show();
  }

  openEditUserForm() {
    const userToEdit = this.selectedUser();

    if (!userToEdit) {
      this.toastService.showGenericError();
      return;
    }

    this.addUserDialog().show({ userToEdit });
  }
}
