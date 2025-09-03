import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
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

import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import {
  QueryTableColumn,
  QueryTableColumnType,
  QueryTableComponent,
} from '~/components/query-table/query-table.component';
import { UserApiService } from '~/domains/user/user.api.service';
import { User } from '~/domains/user/user.model';
import { AddUserDialogComponent } from '~/pages/users/components/add-user-dialog/add-user-dialog.component';
import { AuthService } from '~/services/auth.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-users',
  imports: [
    PageLayoutComponent,
    ButtonModule,
    CardModule,
    QueryTableComponent,
    FormDialogComponent,
    AddUserDialogComponent,
  ],
  providers: [ToastService],
  templateUrl: './users.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPageComponent {
  readonly rtlHelper = inject(RtlHelperService);
  private authService = inject(AuthService);
  private userApiService = inject(UserApiService);
  private toastService = inject(ToastService);

  readonly resetPasswordConfirmationDialog =
    viewChild.required<FormDialogComponent>('resetPasswordConfirmationDialog');
  readonly addUserDialog =
    viewChild.required<AddUserDialogComponent>('addUserDialog');

  users = injectQuery(this.userApiService.getAllUsers());

  readonly selectedUser = signal<undefined | User>(undefined);
  readonly formMode = signal<'add' | 'edit'>('add');

  readonly columns = computed<QueryTableColumn<User>[]>(() => [
    {
      field: 'displayName',
      header: $localize`Name`,
    },
    {
      field: 'username',
      header: $localize`E-mail`,
    },
    {
      field: 'lastLogin',
      header: $localize`Last login`,
      type: QueryTableColumnType.DATE,
    },
  ]);

  readonly canManageUsers = computed(
    () => this.authService.isAdmin || this.authService.isOrganizationAdmin,
  );

  resetPasswordMutation = injectMutation<unknown, Error, { username?: string }>(
    () => ({
      mutationFn: ({ username }) =>
        this.userApiService.resetPassword({
          username,
        }),
      onSuccess: () => {
        this.toastService.showToast({
          detail: $localize`Password reset successful`,
        });
      },
    }),
  );
  readonly contextMenuItems = computed<MenuItem[]>(() => [
    {
      label: $localize`:@@generic-edit:Edit`,
      icon: 'pi pi-pencil',
      command: () => {
        const user = this.selectedUser();
        if (!user) {
          this.toastService.showGenericError();
          return;
        }
        this.openForm('edit');
      },
    },
    {
      label: $localize`:@@reset-password-button:Reset password`,
      icon: 'pi pi-refresh',
      command: () => {
        this.resetPasswordConfirmationDialog().show();
      },
    },
    {
      label: $localize`Copy email`,
      icon: 'pi pi-copy',
      command: () => {
        const user = this.selectedUser();
        if (!user) {
          this.toastService.showGenericError();
          return;
        }
        void navigator.clipboard.writeText(user.username ?? '');
        this.toastService.showToast({
          detail: $localize`Email copied to clipboard`,
        });
      },
    },
  ]);
  openForm(formMode: 'add' | 'edit') {
    this.formMode.set(formMode);
    this.addUserDialog().show();
  }
}
