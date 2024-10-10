import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  ViewChild,
} from '@angular/core';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

import { ConfirmationDialogComponent } from '~/components/confirmation-dialog/confirmation-dialog.component';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import {
  QueryTableColumn,
  QueryTableColumnType,
  QueryTableComponent,
} from '~/components/query-table/query-table.component';
import { UserApiService } from '~/domains/user/user.api.service';
import { User } from '~/domains/user/user.model';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    PageLayoutComponent,
    ButtonModule,
    CardModule,
    QueryTableComponent,
    ConfirmationDialogComponent,
  ],
  providers: [ToastService],
  templateUrl: './users.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPageComponent {
  private userApiService = inject(UserApiService);
  private toastService = inject(ToastService);

  @ViewChild('resetPasswordConfirmationDialog')
  private resetPasswordConfirmationDialog: ConfirmationDialogComponent;

  users = injectQuery(this.userApiService.getAllUsers());

  selectedUser = signal<undefined | User>(undefined);
  formVisible = signal(false);
  formMode = signal<'add' | 'edit'>('add');

  columns = computed<QueryTableColumn<User>[]>(() => [
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

  openForm(formMode: 'add' | 'edit') {
    // TODO: AB30598
    // Copied this from project-team but currently does nothing.
    // It's a good starting point though because we will need to
    // implement add / edit on this page too.
    this.formMode.set(formMode);
    this.formVisible.set(true);
  }

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

  contextMenuItems = computed<MenuItem[]>(() => {
    return [
      {
        label: $localize`:@@generic-edit:Edit`,
        icon: 'pi pi-pencil',
        command: () => {
          const user = this.selectedUser();
          if (!user) {
            this.toastService.showGenericError();
            return;
          }
          this.toastService.showToast({
            detail: 'Functionality not implemented yet',
          });
        },
      },
      {
        label: $localize`:@@reset-password-button:Reset password`,
        icon: 'pi pi-refresh',
        command: () => {
          this.resetPasswordConfirmationDialog.askForConfirmation();
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
    ];
  });
}
