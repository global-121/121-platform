import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  ViewChild,
} from '@angular/core';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { ConfirmationDialogComponent } from '~/components/confirmation-dialog/confirmation-dialog.component';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import {
  QueryTableColumn,
  QueryTableColumnType,
  QueryTableComponent,
} from '~/components/query-table/query-table.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { ProjectUserWithRolesLabel } from '~/domains/project/project.model';
import { AddProjectTeamUserFormComponent } from '~/pages/project-team/components/add-project-team-user-form/add-project-team-user-form.component';
import { AuthService } from '~/services/auth.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-project-team',
  standalone: true,
  imports: [
    PageLayoutComponent,
    CardModule,
    QueryTableComponent,
    AddProjectTeamUserFormComponent,
    ConfirmDialogModule,
    ConfirmationDialogComponent,
  ],
  providers: [ToastService],
  templateUrl: './project-team.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTeamPageComponent {
  // this is injected by the router
  readonly projectId = input.required<string>();

  private projectApiService = inject(ProjectApiService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  @ViewChild('removeUserConfirmationDialog')
  private removeUserConfirmationDialog: ConfirmationDialogComponent;

  selectedUser = signal<ProjectUserWithRolesLabel | undefined>(undefined);
  formVisible = signal(false);
  formMode = signal<'add' | 'edit'>('add');

  project = injectQuery(this.projectApiService.getProject(this.projectId));
  projectUsers = injectQuery(
    this.projectApiService.getProjectUsers(this.projectId),
  );

  removeUserMutation = injectMutation<unknown, Error, { userId?: number }>(
    () => ({
      mutationFn: ({ userId }) =>
        this.projectApiService.removeProjectUser(this.projectId, userId),
      onSuccess: () => {
        this.toastService.showToast({
          detail: $localize`User removed`,
        });
        void this.projectApiService.invalidateCache(this.projectId);
      },
      onError: () => {
        this.toastService.showGenericError();
      },
    }),
  );

  columns = computed<QueryTableColumn<ProjectUserWithRolesLabel>[]>(() => {
    const scopeColumn: QueryTableColumn<ProjectUserWithRolesLabel> = {
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
      {
        field: 'lastLogin',
        header: $localize`Last log in`,
        type: QueryTableColumnType.DATE,
      },
    ];
  });

  canManageAidworkers = computed(() =>
    this.authService.hasPermission({
      projectId: this.projectId(),
      requiredPermission: PermissionEnum.AidWorkerProgramUPDATE,
    }),
  );

  enableScope = computed(() => this.project.data()?.enableScope ?? false);

  openForm(formMode: 'add' | 'edit') {
    this.formMode.set(formMode);
    this.formVisible.set(true);
  }

  contextMenuItems = computed<MenuItem[]>(() => {
    return [
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
          this.removeUserConfirmationDialog.askForConfirmation();
        },
      },
    ];
  });
}
