import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationDialogComponent } from '~/components/confirmation-dialog/confirmation-dialog.component';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import {
  QueryTableColumn,
  QueryTableComponent,
} from '~/components/query-table/query-table.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { ProjectUserWithRolesLabel } from '~/domains/project/project.model';
import { AddUserButtonComponent } from '~/pages/project/project-team/add-user-button/add-user-button.component';
import { AuthService } from '~/services/auth.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-project-team',
  standalone: true,
  imports: [
    PageLayoutComponent,
    QueryTableComponent,
    AddUserButtonComponent,
    ConfirmDialogModule,
    ConfirmationDialogComponent,
  ],
  providers: [ToastService],
  templateUrl: './project-team.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTeamComponent {
  private projectApiService = inject(ProjectApiService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  @ViewChild('confirmationDialog')
  private confirmationDialog: ConfirmationDialogComponent;

  selectedUser = signal<ProjectUserWithRolesLabel | undefined>(undefined);

  // this is injected by the router
  projectId = input.required<number>();

  project = injectQuery(this.projectApiService.getProject(this.projectId));
  projectUsers = injectQuery(
    this.projectApiService.getProjectUsers(this.projectId),
  );

  removeUserMutation = injectMutation(() => ({
    mutationFn: ({ userId }: { userId: number }) =>
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
  }));

  columns = computed<QueryTableColumn<ProjectUserWithRolesLabel>[]>(() => [
    {
      field: 'username',
      header: $localize`User name`,
    },
    {
      field: 'allRolesLabel',
      header: $localize`Roles`,
    },
    {
      field: 'scope',
      header: $localize`Scope`,
      hidden: !this.enableScope(),
    },
    {
      field: 'lastLogin',
      header: $localize`Last log in`,
      type: 'date',
    },
  ]);

  canManageAidworkers = computed(() =>
    this.authService.hasPermission(
      this.projectId(),
      PermissionEnum.AidWorkerProgramUPDATE,
    ),
  );

  enableScope = computed(() => this.project.data()?.enableScope);

  contextMenuItems = computed<MenuItem[] | undefined>(() => {
    if (!this.canManageAidworkers()) {
      return undefined;
    }
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
        command: () => {
          this.toastService.showToast({
            detail: `Edit functionality has not been implemented yet so don't be impatient`,
            severity: 'warn',
          });
        },
      },
      {
        label: $localize`:@@remove-user-button:Remove user`,
        icon: 'pi pi-times text-red-500',
        command: () => {
          const user = this.selectedUser();
          if (!user) {
            this.toastService.showGenericError();
            return;
          }
          this.confirmationDialog.confirm({
            accept: () => {
              this.removeUserMutation.mutate({ userId: user.id });
            },
          });
        },
      },
    ];
  });
}
