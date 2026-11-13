import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { PageLayoutProgramSettingsComponent } from '~/components/page-layout-program-settings/page-layout-program-settings.component';
import { QueryTableComponent } from '~/components/query-table/query-table.component';
import { QueryTableColumn } from '~/components/query-table/query-table.types';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { programHasAccessGroups } from '~/domains/program/program.helper';
import { ProgramUserWithRolesLabel } from '~/domains/program/program.model';
import { AddProgramTeamUserDialogComponent } from '~/pages/program-settings-team/components/add-program-team-user-dialog/add-program-team-user-dialog.component';
import { AuthService } from '~/services/auth.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';
import { TranslatableStringService } from '~/services/translatable-string.service';

type ProgramTeamUser = {
  accessGroupLabel: string;
} & ProgramUserWithRolesLabel;

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
  readonly formMode = signal<'add' | 'edit'>('add');

  program = injectQuery(this.programApiService.getProgram(this.programId));
  programUsers = injectQuery(
    this.programApiService.getProgramUsers(this.programId),
  );
  readonly accessGroupLevels = injectQuery(
    this.programApiService.getAccessGroupLevels({
      programId: this.programId,
    }),
  );

  readonly tableRows = computed<ProgramTeamUser[]>(() => {
    return (this.programUsers.data() ?? []).map((user) => ({
      ...user,
      accessGroupLabel: user.accessGroups
        .map(({ programRegistrationAttributeName, value }) =>
          this.getAccessGroupLabel({
            attributeName: programRegistrationAttributeName,
            value,
          }),
        )
        .join(' / '),
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
  readonly columns = computed<QueryTableColumn<ProgramTeamUser>[]>(() => {
    const scopeColumn: QueryTableColumn<ProgramTeamUser> = {
      field: 'scope',
      header: $localize`:@@attribute-label-scope:Scope`,
      class: 'w-1/3',
    };
    const accessGroupColumn: QueryTableColumn<ProgramTeamUser> = {
      field: 'accessGroupLabel',
      header: $localize`Access group`,
      class: 'w-1/3',
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
      ...(this.enableAccessGroups() ? [accessGroupColumn] : []),
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
  readonly enableAccessGroups = computed(() =>
    programHasAccessGroups({
      accessGroupRegistrationAttributeNames:
        this.accessGroupLevels.data()?.accessGroupRegistrationAttributeNames,
    }),
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
        this.openForm('edit');
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
  private getAccessGroupLabel({
    attributeName,
    value,
  }: {
    attributeName: string;
    value: string;
  }): string {
    const attribute = this.program
      .data()
      ?.programRegistrationAttributes.find(
        ({ name }) => name === attributeName,
      );
    if (!attribute) {
      return value;
    }

    const option = attribute.options?.find(
      ({ option: optionValue }) => optionValue === value,
    );
    const label = this.translatableStringService.translate(option?.label);
    if (!label) {
      return value;
    }

    return label;
  }

  openForm(formMode: 'add' | 'edit') {
    this.formMode.set(formMode);
    this.addUserDialog().show();
  }
}
