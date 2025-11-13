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
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { CardEditableComponent } from '~/components/card-editable/card-editable.component';
import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { PageLayoutProgramSettingsComponent } from '~/components/page-layout-program-settings/page-layout-program-settings.component';
import {
  QueryTableColumn,
  QueryTableComponent,
} from '~/components/query-table/query-table.component';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { ProgramUserWithRolesLabel } from '~/domains/program/program.model';
import { AddProgramTeamUserDialogComponent } from '~/pages/program-settings-team/components/add-program-team-user-dialog/add-program-team-user-dialog.component';
import { AuthService } from '~/services/auth.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-program-settings-team',
  imports: [
    ButtonModule,
    QueryTableComponent,
    AddProgramTeamUserDialogComponent,
    ConfirmDialogModule,
    FormDialogComponent,
    PageLayoutProgramSettingsComponent,
    CardEditableComponent,
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

  readonly addUserDialog =
    viewChild.required<AddProgramTeamUserDialogComponent>('addUserDialog');
  readonly removeUserConfirmationDialog =
    viewChild.required<FormDialogComponent>('removeUserConfirmationDialog');

  readonly selectedUser = signal<ProgramUserWithRolesLabel | undefined>(
    undefined,
  );
  readonly formMode = signal<'add' | 'edit'>('add');
  readonly isEditing = signal(false);

  program = injectQuery(this.programApiService.getProgram(this.programId));
  programUsers = injectQuery(
    this.programApiService.getProgramUsers(this.programId),
  );

  removeUserMutation = injectMutation<unknown, Error, { userId?: number }>(
    () => ({
      mutationFn: ({ userId }) =>
        this.programApiService.removeProgramUser(this.programId, userId),
      onSuccess: () => {
        this.toastService.showToast({
          detail: $localize`User removed`,
        });
        void this.programApiService.invalidateCache(this.programId);
      },
      onError: () => {
        this.toastService.showGenericError();
      },
    }),
  );

  readonly columns = computed<QueryTableColumn<ProgramUserWithRolesLabel>[]>(
    () => {
      const scopeColumn: QueryTableColumn<ProgramUserWithRolesLabel> = {
        field: 'scope',
        header: $localize`Scope`,
      };

      return [
        {
          field: 'username',
          header: $localize`User name`,
        },
        {
          field: 'allRolesLabel',
          header: $localize`Roles`,
        },
        ...(this.enableScope() ? [scopeColumn] : []),
      ];
    },
  );

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
        this.openForm('edit');
      },
    },
    {
      label: $localize`:@@remove-user-button:Remove user`,
      icon: 'pi pi-times text-red-500',
      visible: this.canManageAidworkers(),
      command: () => {
        this.removeUserConfirmationDialog().show();
      },
    },
  ]);

  openForm(formMode: 'add' | 'edit') {
    this.formMode.set(formMode);
    this.addUserDialog().show();
  }
}
